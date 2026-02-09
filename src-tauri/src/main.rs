#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod backend;

use tauri::Manager;

#[tauri::command]
async fn check_python_backend() -> Result<String, String> {
    backend::check_python_backend().await
}

#[tauri::command]
async fn check_node_backend() -> Result<String, String> {
    backend::check_node_backend().await
}

#[tauri::command]
fn get_system_metrics() -> Result<serde_json::Value, String> {
    backend::get_system_metrics()
}

#[tauri::command]
fn launch_application(app_name: String) -> Result<String, String> {
    backend::launch_application(&app_name)
}

#[tauri::command]
async fn query_rag(query: String) -> Result<serde_json::Value, String> {
    backend::query_rag(&query).await
}

#[tauri::command]
async fn toggle_voice_recognition(active: bool) -> Result<String, String> {
    backend::toggle_voice_recognition(active).await
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            check_python_backend,
            check_node_backend,
            get_system_metrics,
            launch_application,
            query_rag,
            toggle_voice_recognition,
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.set_effects(tauri::window::EffectsConfig::default()).map_err(|e| {
                eprintln!("Failed to set window effects: {}", e);
            })?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
