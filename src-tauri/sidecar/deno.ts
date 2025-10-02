// Deno sidecar server - proxies requests between Tauri frontend and external APIs

interface Seat {
  seatNumber: number;
  microphoneOn: boolean;
  requestingToSpeak: boolean;
  role: string;
}

interface Config {
  api: {
    baseUrl: string;
    endpoints: Record<string, string>;
  };
  auth: {
    bearerToken: string;
  };
  sidecar: {
    port: number;
    host: string;
  };
  deno?: {
    tasks?: Record<string, string>;
    compilerOptions?: {
      lib?: string[];
      strict?: boolean;
    };
  };
}

interface FetchSeatsRequest {
  endpoint?: string; // Optional - defaults to "seats"
}

interface FetchOrderRequest {
  endpoint?: string; // Optional - defaults to "speakers" or "requests"
}

interface UpdateSeatRequest {
  seatNumber: number;
  microphoneOn: boolean;
  requestingToSpeak: boolean;
}

// Load configuration from config.json
let config: Config;
try {
  // Try multiple possible config paths for both dev and production
  const possiblePaths = [
    "./config.json",                        // Same directory (production)
    "./sidecar/config.json",                // Relative to app root (production)
    "../sidecar/config.json",               // One level up (dev)
    "../../src-tauri/sidecar/config.json",  // Dev from workspace root
    "src-tauri/sidecar/config.json",        // Direct dev path
    "resources/sidecar/config.json",        // Tauri resource bundle path
    "_up_/sidecar/config.json"              // Tauri resource path variant
  ];
  
  let configText = "";
  let configPath = "";
  
  for (const path of possiblePaths) {
    try {
      console.log(`Trying config path: ${path}`);
      configText = await Deno.readTextFile(path);
      configPath = path;
      console.log(`✅ Found config at: ${path}`);
      break;
    } catch (error) {
      console.log(`❌ Config not found at: ${path} (${error.name})`);
      continue;
    }
  }
  
  if (!configText) {
    throw new Error("Config file not found in any expected location");
  }
  
  config = JSON.parse(configText);
  console.log(`✅ Loaded config from: ${configPath}`);
} catch (error) {
  console.error("Failed to load or parse config:", error);
  console.error("Current working directory:", Deno.cwd());
  console.error("Tried paths:", [
    "./config.json",
    "./sidecar/config.json", 
    "../sidecar/config.json",
    "../../src-tauri/sidecar/config.json",
    "src-tauri/sidecar/config.json",
    "resources/sidecar/config.json",
    "_up_/sidecar/config.json"
  ]);
  Deno.exit(1);
}

// Universal fetch clock - caches all data and refreshes it every second
interface UniversalData {
  seats: Seat[];
  speakerOrder: number[];
  requestOrder: number[];
  lastUpdated: number;
  isUpdating: boolean;
}

class HybridResponsiveClock {
  private data: UniversalData = {
    seats: [],
    speakerOrder: [],
    requestOrder: [],
    lastUpdated: 0,
    isUpdating: false
  };
  
  // Timing configuration
  private readonly BASELINE_INTERVAL_MS = 1000;  // Slow baseline (1 second)
  private readonly BURST_INTERVAL_MS = 100;      // Fast burst mode (100ms)
  private readonly BURST_DURATION_MS = 5000;     // Burst for 5 seconds
  private readonly CACHE_VALID_MS = 150;         // Very short cache validity
  
  // State management
  private updateInterval: number | null = null;
  private burstTimeout: number | null = null;
  private isBurstMode = false;
  private lastChangeDetected = 0;

  async start() {
    console.log("� Starting hybrid responsive clock...");
    
    // Initial fetch
    await this.fetchAllData();
    
    // Start with baseline polling
    this.startBaseline();
    
    console.log("✅ Hybrid responsive clock started");
  }

  stop() {
    this.clearAllTimers();
    console.log("⏹️ Hybrid responsive clock stopped");
  }

  // PUBLIC: Trigger immediate fetch on user actions
  async onUserAction(action: string = "user_action") {
    console.log(`⚡ Immediate fetch triggered by: ${action}`);
    await this.fetchAllData();
    this.enableBurstMode();
  }

  // PUBLIC: Check if data changed (for burst mode detection)
  private hasDataChanged(newData: UniversalData): boolean {
    const oldData = this.data;
    
    // Quick comparison of key metrics
    if (oldData.seats.length !== newData.seats.length) return true;
    if (oldData.speakerOrder.length !== newData.speakerOrder.length) return true;
    if (oldData.requestOrder.length !== newData.requestOrder.length) return true;
    
    // Check for mic status changes
    for (let i = 0; i < newData.seats.length; i++) {
      const oldSeat = oldData.seats.find(s => s.seatNumber === newData.seats[i].seatNumber);
      if (!oldSeat) return true;
      
      if (oldSeat.microphoneOn !== newData.seats[i].microphoneOn) return true;
      if (oldSeat.requestingToSpeak !== newData.seats[i].requestingToSpeak) return true;
    }
    
    return false;
  }

  private enableBurstMode() {
    if (this.isBurstMode) {
      // Extend burst mode
      if (this.burstTimeout) clearTimeout(this.burstTimeout);
    } else {
      // Switch to burst mode
      console.log("🔥 Entering burst mode (100ms polling)");
      this.isBurstMode = true;
      this.restartPolling();
    }
    
    // Set timeout to return to baseline
    this.burstTimeout = setTimeout(() => {
      console.log("🐌 Returning to baseline mode (1s polling)");
      this.isBurstMode = false;
      this.restartPolling();
    }, this.BURST_DURATION_MS);
  }

  private restartPolling() {
    // Clear existing interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Start new interval with current mode timing
    const interval = this.isBurstMode ? this.BURST_INTERVAL_MS : this.BASELINE_INTERVAL_MS;
    this.startPolling(interval);
  }

  private startBaseline() {
    this.startPolling(this.BASELINE_INTERVAL_MS);
  }

  private startPolling(intervalMs: number) {
    this.updateInterval = setInterval(async () => {
      await this.fetchAllData();
    }, intervalMs);
    
    console.log(`⏰ Polling started: ${intervalMs}ms interval`);
  }

  private clearAllTimers() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.burstTimeout) {
      clearTimeout(this.burstTimeout);
      this.burstTimeout = null;
    }
  }

  private async fetchAllData() {
    if (this.data.isUpdating) {
      console.log("⏭️ Skipping fetch - already updating");
      return;
    }

    this.data.isUpdating = true;
    
    try {
      // Fetch all data in parallel from the D-Cerno API
      const [seatsData, speakerOrderData, requestOrderData] = await Promise.all([
        fetchSeats(`${config.api.baseUrl}${config.api.endpoints.seats}`, config.auth.bearerToken),
        fetchOrder(`${config.api.baseUrl}${config.api.endpoints.speakers}`, config.auth.bearerToken),
        fetchOrder(`${config.api.baseUrl}${config.api.endpoints.requests}`, config.auth.bearerToken)
      ]);

      const newData: UniversalData = {
        seats: seatsData,
        speakerOrder: speakerOrderData,
        requestOrder: requestOrderData,
        lastUpdated: Date.now(),
        isUpdating: false
      };

      // Check for changes and trigger burst mode if needed
      const hasChanges = this.hasDataChanged(newData);
      if (hasChanges && !this.isBurstMode) {
        this.lastChangeDetected = Date.now();
        console.log("🔄 Changes detected - enabling burst mode");
        this.enableBurstMode();
      }

      // Update cache
      this.data = newData;

      const mode = this.isBurstMode ? "BURST" : "BASELINE";
      console.log(`🔄 [${mode}] Data updated: ${seatsData.length} seats, ${speakerOrderData.length} speakers, ${requestOrderData.length} requests`);
      
    } catch (error) {
      console.error("❌ Hybrid fetch failed:", error);
      this.data.isUpdating = false;
    }
  }

  getData(): UniversalData {
    return { ...this.data };
  }

  isCacheValid(): boolean {
    const now = Date.now();
    return (now - this.data.lastUpdated) < this.CACHE_VALID_MS;
  }

  // Status info for monitoring
  getStatus() {
    return {
      mode: this.isBurstMode ? "BURST" : "BASELINE",
      interval: this.isBurstMode ? this.BURST_INTERVAL_MS : this.BASELINE_INTERVAL_MS,
      lastUpdated: this.data.lastUpdated,
      cacheValid: this.isCacheValid(),
      lastChangeDetected: this.lastChangeDetected
    };
  }
}

// Create global instance
const responsiveClock = new HybridResponsiveClock();

// API Functions
async function fetchSeats(url: string, token: string): Promise<Seat[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const seats: Seat[] = await response.json();
    return seats;
  } catch (error) {
    throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function fetchOrder(url: string, token: string): Promise<number[]> {
  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const order: number[] = await response.json();
    return order;
  } catch (error) {
    throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function updateSeat(url: string, token: string, seatData: { microphoneOn: boolean; requestingToSpeak: boolean }): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(seatData)
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
  } catch (error) {
    throw new Error(`Request failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// HTTP Server
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  
  // GET /api/universal - Get all data at once from hybrid responsive clock
  if (url.pathname === "/api/universal" && req.method === "GET") {
    try {
      const data = responsiveClock.getData();
      
      return new Response(JSON.stringify({ 
        success: true, 
        data: {
          seats: data.seats,
          speakerOrder: data.speakerOrder,
          requestOrder: data.requestOrder,
          lastUpdated: data.lastUpdated,
          cacheValid: responsiveClock.isCacheValid(),
          clockStatus: responsiveClock.getStatus()
        }
      }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }
  
  // POST /api/trigger - Trigger immediate fetch (for user actions)
  if (url.pathname === "/api/trigger" && req.method === "POST") {
    try {
      const body = await req.json();
      const action = body.action || "manual_trigger";
      
      // Trigger immediate fetch and burst mode
      await responsiveClock.onUserAction(action);
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Immediate fetch triggered: ${action}`,
        status: responsiveClock.getStatus()
      }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }
  
  // POST /api/seats - Fetch discussion seats (LEGACY - kept for backwards compatibility)
  if (url.pathname === "/api/seats" && req.method === "POST") {
    try {
      const body: FetchSeatsRequest = await req.json();
      const endpoint = body.endpoint || config.api.endpoints.seats;
      const fullUrl = `${config.api.baseUrl}${endpoint}`;
      const seats = await fetchSeats(fullUrl, config.auth.bearerToken);
      
      return new Response(JSON.stringify({ success: true, data: seats }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }

  // POST /api/speakers - Fetch speaker order
  if (url.pathname === "/api/speakers" && req.method === "POST") {
    try {
      const body: FetchOrderRequest = await req.json();
      const endpoint = body.endpoint || config.api.endpoints.speakers;
      const fullUrl = `${config.api.baseUrl}${endpoint}`;
      const order = await fetchOrder(fullUrl, config.auth.bearerToken);
      
      return new Response(JSON.stringify({ success: true, data: order }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }

  // POST /api/requests - Fetch request order  
  if (url.pathname === "/api/requests" && req.method === "POST") {
    try {
      const body: FetchOrderRequest = await req.json();
      const endpoint = body.endpoint || config.api.endpoints.requests;
      const fullUrl = `${config.api.baseUrl}${endpoint}`;
      const order = await fetchOrder(fullUrl, config.auth.bearerToken);
      
      return new Response(JSON.stringify({ success: true, data: order }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }

  // PUT /api/seat/{seatNumber} - Update seat status
  if (url.pathname.startsWith("/api/seat/") && req.method === "PUT") {
    try {
      const seatNumber = url.pathname.split("/")[3];
      const body: { microphoneOn: boolean; requestingToSpeak: boolean } = await req.json();
      
      const endpoint = `${config.api.endpoints.updateSeat}/${seatNumber}`;
      const fullUrl = `${config.api.baseUrl}${endpoint}`;
      
      await updateSeat(fullUrl, config.auth.bearerToken, body);
      
      return new Response(JSON.stringify({ success: true, message: `Seat ${seatNumber} updated successfully` }), {
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            ...corsHeaders
          },
        }
      );
    }
  }

  // GET /health - Health check for Tauri
  if (url.pathname === "/health" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      headers: { 
        "Content-Type": "application/json",
        ...corsHeaders
      },
    });
  }

  return new Response("Not Found", { 
    status: 404,
    headers: corsHeaders
  });
}

// Server Startup
const port = config.sidecar.port;

function findAvailablePort(startPort: number): number {
  for (let port = startPort; port <= startPort + 10; port++) {
    try {
      const listener = Deno.listen({ port });
      listener.close();
      return port;
    } catch (error) {
      if (error instanceof Deno.errors.AddrInUse) {
        console.log(`Port ${port} is in use, trying ${port + 1}...`);
        continue;
      }
      throw error;
    }
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + 10}`);
}

function startServer() {
  try {
    const availablePort = findAvailablePort(port);
    console.log(`Deno sidecar server starting on port ${availablePort}`);
    
    if (availablePort !== port) {
      console.log(`⚠️ Note: Using port ${availablePort} instead of ${port} due to port conflict`);
    }
    
    // Start the hybrid responsive clock
    responsiveClock.start();
    
    Deno.serve({
      port: availablePort,
      hostname: "localhost",
    }, handler);
    
    console.log(`✅ Server is listening on http://localhost:${availablePort}`);
  } catch (error) {
    console.error(`❌ Failed to start server:`, error);
    Deno.exit(1);
  }
}

startServer();