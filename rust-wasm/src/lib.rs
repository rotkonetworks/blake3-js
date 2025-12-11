//! Blake3 WASM with Rayon parallelism
//!
//! This module provides Blake3 hashing with multi-threaded support in WASM
//! using wasm-bindgen-rayon for Web Worker threading.

use wasm_bindgen::prelude::*;

// Re-export rayon thread pool init for JavaScript
pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format!($($t)*)))
}

/// Initialize the WASM module
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
    console_log!("Blake3 WASM module initialized");
}

/// Hash data using Blake3 (single-threaded)
#[wasm_bindgen]
pub fn hash(data: &[u8]) -> Vec<u8> {
    blake3::hash(data).as_bytes().to_vec()
}

/// Hash data using Blake3 with custom output length
#[wasm_bindgen]
pub fn hash_xof(data: &[u8], output_len: usize) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    hasher.update(data);
    let mut output = vec![0u8; output_len];
    hasher.finalize_xof().fill(&mut output);
    output
}

/// Hash data using Blake3 with Rayon parallelism
/// This uses multiple threads for large inputs
#[wasm_bindgen]
pub fn hash_rayon(data: &[u8]) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    hasher.update_rayon(data);
    hasher.finalize().as_bytes().to_vec()
}

/// Hash data using Blake3 with Rayon and custom output length
#[wasm_bindgen]
pub fn hash_rayon_xof(data: &[u8], output_len: usize) -> Vec<u8> {
    let mut hasher = blake3::Hasher::new();
    hasher.update_rayon(data);
    let mut output = vec![0u8; output_len];
    hasher.finalize_xof().fill(&mut output);
    output
}

/// Keyed hash (MAC mode)
#[wasm_bindgen]
pub fn keyed_hash(key: &[u8], data: &[u8]) -> Result<Vec<u8>, JsValue> {
    if key.len() != 32 {
        return Err(JsValue::from_str("Key must be 32 bytes"));
    }
    let key_array: [u8; 32] = key.try_into().unwrap();
    Ok(blake3::keyed_hash(&key_array, data).as_bytes().to_vec())
}

/// Derive key (KDF mode)
#[wasm_bindgen]
pub fn derive_key(context: &str, key_material: &[u8], output_len: usize) -> Vec<u8> {
    let mut output = vec![0u8; output_len];
    blake3::Hasher::new_derive_key(context)
        .update(key_material)
        .finalize_xof()
        .fill(&mut output);
    output
}

/// Get number of rayon threads
#[wasm_bindgen]
pub fn get_thread_count() -> usize {
    rayon::current_num_threads()
}

/// Benchmark helper - hash N times and return total microseconds
#[wasm_bindgen]
pub fn benchmark_hash(data: &[u8], iterations: u32) -> f64 {
    use std::time::Instant;

    // Warm up
    for _ in 0..3 {
        let _ = blake3::hash(data);
    }

    let start = Instant::now();
    for _ in 0..iterations {
        let _ = blake3::hash(data);
    }
    start.elapsed().as_micros() as f64
}

/// Benchmark helper - hash_rayon N times and return total microseconds
#[wasm_bindgen]
pub fn benchmark_hash_rayon(data: &[u8], iterations: u32) -> f64 {
    use std::time::Instant;

    // Warm up
    for _ in 0..3 {
        let mut hasher = blake3::Hasher::new();
        hasher.update_rayon(data);
        let _ = hasher.finalize();
    }

    let start = Instant::now();
    for _ in 0..iterations {
        let mut hasher = blake3::Hasher::new();
        hasher.update_rayon(data);
        let _ = hasher.finalize();
    }
    start.elapsed().as_micros() as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash() {
        let data = b"hello world";
        let result = hash(data);
        assert_eq!(result.len(), 32);
    }

    #[test]
    fn test_empty_hash() {
        let expected = hex::decode(
            "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262"
        ).unwrap();
        let result = hash(&[]);
        assert_eq!(result, expected);
    }
}
