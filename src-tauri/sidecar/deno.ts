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

// Load configuration from config.json
let config: Config;
try {
  const configText = await Deno.readTextFile("./sidecar/config.json");
  config = JSON.parse(configText);
  console.log(`✅ Loaded config from: ./sidecar/config.json`);
} catch (error) {
  console.error("Failed to load or parse config:", error);
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

// HTTP Server
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
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

  // Add more endpoints here:
  // if (url.pathname === "/api/users" && req.method === "POST") { ... }

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