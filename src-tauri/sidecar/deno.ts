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
  // Try multiple possible config paths
  const possiblePaths = [
    "./sidecar/config.json",        // Production/relative path
    "./config.json",                // Same directory
    "../sidecar/config.json",       // One level up
    "config.json"                   // Direct file
  ];
  
  let configText = "";
  let configPath = "";
  
  for (const path of possiblePaths) {
    try {
      configText = await Deno.readTextFile(path);
      configPath = path;
      break;
    } catch {
      // Try next path
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
  console.error("Tried paths: ./sidecar/config.json, ./config.json, ../sidecar/config.json, config.json");
  Deno.exit(1);
}

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
  
  // POST /api/seats - Fetch discussion seats
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