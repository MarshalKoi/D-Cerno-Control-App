use tauri::command;
use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use std::path::PathBuf;
use std::time::Duration;
use tokio::time::sleep;

// Store the sidecar process reference
static SIDECAR_PROCESS: Mutex<Option<Child>> = Mutex::new(None);

fn find_sidecar_script() -> Result<PathBuf, String> {
    // List of possible locations for the sidecar script
    let possible_paths = [
        "src-tauri/sidecar/deno.ts",     // Development from project root
        "sidecar/deno.ts",               // Production or from tauri dir
        "../sidecar/deno.ts",            // Alternative
        "../../src-tauri/sidecar/deno.ts", // From nested directory
    ];
    
    for path_str in &possible_paths {
        let path = PathBuf::from(path_str);
        if path.exists() {
            return Ok(path.canonicalize().map_err(|e| format!("Failed to canonicalize path: {}", e))?);
        }
    }
    
    // If no path exists, return the most likely development path
    Ok(PathBuf::from(possible_paths[0]))
}

#[command]
async fn start_sidecar() -> Result<String, String> {
    // Check if already running first
    {
        let mut process_guard = SIDECAR_PROCESS.lock().unwrap();
        if let Some(ref mut child) = process_guard.as_mut() {
            match child.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited, remove it
                    *process_guard = None;
                }
                Ok(None) => {
                    // Process is still running
                    return Ok("Sidecar already running".to_string());
                }
                Err(e) => {
                    return Err(format!("Failed to check sidecar status: {}", e));
                }
            }
        }
    } // Release mutex lock before async operations
    
    // Kill any existing Deno processes that might conflict (hidden)
    #[cfg(target_os = "windows")]
    let _ = {
        use std::os::windows::process::CommandExt;
        Command::new("taskkill")
            .args(&["/F", "/IM", "deno.exe"])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
    };
    
    #[cfg(not(target_os = "windows"))]
    let _ = Command::new("pkill")
        .args(&["-f", "deno"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .output();
    
    // Wait a moment for processes to terminate
    sleep(Duration::from_millis(500)).await;
    
    // Find the sidecar script
    let sidecar_path = find_sidecar_script()?;
    
    // Start the Deno process (hidden, no terminal window)
    #[cfg(target_os = "windows")]
    let child = {
        use std::os::windows::process::CommandExt;
        Command::new("deno")
            .args(&["run", "--allow-net", "--allow-read"])
            .arg(&sidecar_path)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .spawn()
    };
    
    #[cfg(not(target_os = "windows"))]
    let child = Command::new("deno")
        .args(&["run", "--allow-net", "--allow-read"])
        .arg(&sidecar_path)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();
        
    let child = child.map_err(|e| {
            format!(
                "Failed to start sidecar at '{}': {}. Make sure Deno is installed and in PATH.", 
                sidecar_path.display(), 
                e
            )
        })?;
    
    // Store the child process
    {
        let mut process_guard = SIDECAR_PROCESS.lock().unwrap();
        *process_guard = Some(child);
    }
    
    Ok(format!("Sidecar started successfully from: {}", sidecar_path.display()))
}

#[command]
async fn stop_sidecar() -> Result<String, String> {
    let mut process_guard = SIDECAR_PROCESS.lock().unwrap();
    
    if let Some(mut process) = process_guard.take() {
        process.kill().map_err(|e| format!("Failed to kill sidecar: {}", e))?;
        Ok("Sidecar stopped successfully".to_string())
    } else {
        Ok("No sidecar process to stop".to_string())
    }
}

#[command]
async fn get_sidecar_status() -> Result<String, String> {
    let mut process_guard = SIDECAR_PROCESS.lock().unwrap();
    
    if let Some(ref mut child) = process_guard.as_mut() {
        match child.try_wait() {
            Ok(Some(status)) => {
                *process_guard = None; // Remove dead process
                Ok(format!("Sidecar exited with status: {}", status))
            }
            Ok(None) => Ok("Sidecar is running".to_string()),
            Err(e) => Err(format!("Failed to check sidecar status: {}", e)),
        }
    } else {
        Ok("No sidecar process".to_string())
    }
}

#[command]
async fn restart_sidecar() -> Result<String, String> {
    // Force stop any existing sidecar
    let _ = stop_sidecar().await;
    
    // Kill any orphaned Deno processes (hidden)
    #[cfg(target_os = "windows")]
    let _ = {
        use std::os::windows::process::CommandExt;
        Command::new("taskkill")
            .args(&["/F", "/IM", "deno.exe"])
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .output()
    };
    
    #[cfg(not(target_os = "windows"))]
    let _ = Command::new("pkill")
        .args(&["-f", "deno"])
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .output();
    
    // Wait for cleanup
    sleep(Duration::from_secs(1)).await;
    
    // Start fresh
    start_sidecar().await
}

async fn wait_for_sidecar_startup() -> Result<(), String> {
    // More robust startup check - try to connect to the health endpoint
    for attempt in 1..=15 { // Try for up to 15 seconds
        println!("   Health check attempt {} of 15...", attempt);
        
        // Try the expected port first
        match reqwest::Client::new()
            .get("http://localhost:8080/health")
            .timeout(Duration::from_secs(2))
            .send()
            .await
        {
            Ok(response) if response.status().is_success() => {
                println!("✅ Sidecar health check passed on port 8080");
                return Ok(());
            }
            Ok(_) => {
                println!("   Port 8080 responded but not healthy");
            }
            Err(_) => {
                println!("   Port 8080 not ready yet");
            }
        }
        
        // Wait 1 second before next attempt
        sleep(Duration::from_secs(1)).await;
    }
    
    println!("⚠️ Sidecar health check didn't pass within 15 seconds");
    println!("   The frontend will retry connecting automatically");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            start_sidecar, 
            stop_sidecar,
            restart_sidecar,
            get_sidecar_status
        ])
        .setup(|_app| {
            // Start the sidecar automatically on app startup
            tauri::async_runtime::spawn(async move {
                println!("🚀 Starting sidecar...");
                
                // Try up to 3 times with cleanup between attempts
                for attempt in 1..=3 {
                    println!("   Attempt {} of 3...", attempt);
                    
                    match restart_sidecar().await {
                        Ok(msg) => {
                            println!("✅ {}", msg);
                            // Wait for sidecar to be ready
                            if let Err(e) = wait_for_sidecar_startup().await {
                                eprintln!("⚠️ {}", e);
                            } else {
                                println!("✅ Sidecar is ready and responding");
                            }
                            break;
                        }
                        Err(e) => {
                            eprintln!("❌ Attempt {} failed: {}", attempt, e);
                            if attempt < 3 {
                                println!("   Retrying in 2 seconds...");
                                sleep(Duration::from_secs(2)).await;
                            } else {
                                eprintln!("❌ All attempts failed. Sidecar may need manual cleanup.");
                                eprintln!("   Try running: cleanup-ports.bat");
                            }
                        }
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Clean shutdown of sidecar when window closes
                tauri::async_runtime::spawn(async move {
                    let _ = stop_sidecar().await;
                });
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}