use std::process::{Command, Stdio};
use std::time::Duration;
use serde_json::json;
use sysinfo::{System, SystemExt, CpuExt};

/// Application whitelist - only these apps can be launched
const WHITELISTED_APPS: &[&str] = &[
    "ltspice",
    "matlab",
    "proteus",
    "vscode",
    "chrome",
    "whatsapp",
    "youtube",
];

/// Application paths for Windows
const APP_PATHS: &[(&str, &str)] = &[
    ("ltspice", r#"C:\Program Files\LTC\LTspiceXVII\XVIIx64.exe"#),
    ("matlab", r#"C:\Program Files\MATLAB\R2023a\bin\matlab.exe"#),
    ("proteus", r#"C:\Program Files\Labcenter Electronics\Proteus 8 Professional\BIN\PDS.EXE"#),
    ("vscode", r#"C:\Program Files\Microsoft VS Code\Code.exe"#),
    ("chrome", r#"C:\Program Files\Google\Chrome\Application\chrome.exe"#),
    ("whatsapp", r#"C:\Program Files\WhatsApp\WhatsApp.exe"#),
];

/// Check if Python backend is running
pub async fn check_python_backend() -> Result<String, String> {
    // Check if port 8000 is listening
    let output = Command::new("cmd")
        .args(["/c", "netstat", "-an", "|", "findstr", ":8000"])
        .output();
    
    match output {
        Ok(o) if o.status.success() => Ok("connected".to_string()),
        _ => Err("Python backend not running".to_string()),
    }
}

/// Check if Node.js backend is running
pub async fn check_node_backend() -> Result<String, String> {
    // Check if port 3001 is listening
    let output = Command::new("cmd")
        .args(["/c", "netstat", "-an", "|", "findstr", ":3001"])
        .output();
    
    match output {
        Ok(o) if o.status.success() => Ok("connected".to_string()),
        _ => Err("Node.js backend not running".to_string()),
    }
}

/// Get system metrics
pub fn get_system_metrics() -> Result<serde_json::Value, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    let cpu_usage = sys.global_cpu_info().cpu_usage() as u32;
    let ram_usage = (sys.used_memory() * 100 / sys.total_memory()) as u32;
    let temperature = 45; // Would need platform-specific code for actual temperature
    
    Ok(json!({
        "cpu": cpu_usage,
        "ram": ram_usage,
        "temperature": temperature,
        "network": "online"
    }))
}

/// Launch a whitelisted application
pub fn launch_application(app_name: &str) -> Result<String, String> {
    // Validate app is whitelisted
    if !WHITELISTED_APPS.contains(&app_name) {
        return Err(format!("Application '{}' is not whitelisted", app_name));
    }
    
    // Special case for YouTube (web URL)
    if app_name == "youtube" {
        Command::new("cmd")
            .args(["/c", "start", "https://youtube.com"])
            .stdout(Stdio::null())
            .spawn()
            .map_err(|e| e.to_string())?;
        return Ok("YouTube opened in browser".to_string());
    }
    
    // Find app path
    let app_path = APP_PATHS.iter()
        .find(|(name, _)| *name == app_name)
        .map(|(_, path)| *path)
        .ok_or_else(|| format!("Path not found for '{}'", app_name))?;
    
    // Launch the application
    Command::new("cmd")
        .args(["/c", "start", "", app_path])
        .stdout(Stdio::null())
        .spawn()
        .map_err(|e| e.to_string())?;
    
    Ok(format!("Launched {}", app_name))
}

/// Query the RAG system via Python backend
pub async fn query_rag(query: &str) -> Result<serde_json::Value, String> {
    // Make HTTP request to Python backend
    let client = reqwest::Client::new();
    let response = client
        .post("http://localhost:8000/rag/query")
        .json(&json!({ "query": query }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    if response.status().is_success() {
        response.json().await.map_err(|e| e.to_string())
    } else {
        Err(format!("RAG query failed: {}", response.status()))
    }
}

/// Toggle voice recognition
pub async fn toggle_voice_recognition(active: bool) -> Result<String, String> {
    // This would integrate with local speech recognition
    // For now, just return a status
    if active {
        Ok("Voice recognition activated".to_string())
    } else {
        Ok("Voice recognition deactivated".to_string())
    }
}
