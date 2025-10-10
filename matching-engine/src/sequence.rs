// BitCurrent Matching Engine - Sequence Manager
// Manages sequence IDs for event sourcing and recovery

use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

const CHECKPOINT_INTERVAL: u64 = 10000;

#[derive(Debug, Clone)]
pub struct SequenceManager {
    current: Arc<AtomicU64>,
    checkpoint_interval: u64,
}

impl SequenceManager {
    pub fn new() -> Self {
        Self {
            current: Arc::new(AtomicU64::new(0)),
            checkpoint_interval: CHECKPOINT_INTERVAL,
        }
    }

    pub fn with_interval(checkpoint_interval: u64) -> Self {
        Self {
            current: Arc::new(AtomicU64::new(0)),
            checkpoint_interval,
        }
    }

    /// Get next sequence number
    pub fn next(&self) -> u64 {
        self.current.fetch_add(1, Ordering::SeqCst)
    }

    /// Get current sequence number
    pub fn current(&self) -> u64 {
        self.current.load(Ordering::SeqCst)
    }

    /// Set sequence number (for recovery)
    pub fn set(&self, value: u64) {
        self.current.store(value, Ordering::SeqCst);
    }

    /// Check if checkpoint is needed
    pub fn needs_checkpoint(&self) -> bool {
        self.current() % self.checkpoint_interval == 0
    }
}

impl Default for SequenceManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sequence_increment() {
        let seq = SequenceManager::new();
        
        assert_eq!(seq.current(), 0);
        assert_eq!(seq.next(), 0);
        assert_eq!(seq.current(), 1);
        assert_eq!(seq.next(), 1);
        assert_eq!(seq.current(), 2);
    }

    #[test]
    fn test_sequence_set() {
        let seq = SequenceManager::new();
        
        seq.set(1000);
        assert_eq!(seq.current(), 1000);
        assert_eq!(seq.next(), 1000);
        assert_eq!(seq.current(), 1001);
    }

    #[test]
    fn test_checkpoint_detection() {
        let seq = SequenceManager::with_interval(100);
        
        // Set to just before checkpoint
        seq.set(99);
        assert!(!seq.needs_checkpoint());
        
        seq.next(); // Now at 100
        assert!(seq.needs_checkpoint());
        
        seq.next(); // Now at 101
        assert!(!seq.needs_checkpoint());
    }
}



