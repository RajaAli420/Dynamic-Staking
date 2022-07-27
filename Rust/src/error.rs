use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum StakeError {
    /// Invalid instruction
    #[error("Invalid Instruction")]
    InvalidInstruction,
    #[error("Calling Wallet Is Not Allowed")]
    InvalidOwner,
    #[error("Not Allowed")]
    InvalidToken,
    #[error("Invalid")]
    InvalidPDA,
    #[error("Cannot Withdraw More Than Staked")]
    WithdrawLimit,
    #[error("Current Stakers Will Empty The Pool")]
    RewardEnding,
    
}

impl From<StakeError> for ProgramError {
    fn from(e: StakeError) -> Self {
        ProgramError::Custom(e as u32)
    }
}