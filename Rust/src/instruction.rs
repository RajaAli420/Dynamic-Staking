use {
    crate::error::StakeError::InvalidInstruction,
    solana_program::{program_error::ProgramError, pubkey::Pubkey},
    std::convert::TryInto,
};

const _U16_BYTES: usize = 2;
pub enum DynamicAPRInstruction {
    Stake {
        amount: u64,
        time_of_stake: u64,
    },
    Unstake,
    ClaimReward,
    WithdrawPool,
    InitializePlatform {
        owner: Pubkey,
        locking_time: u64,
        apr: u64,
    },
    RefundStakers,
    AddTokenToPools {
        token_amount: u64,
    },
}

impl DynamicAPRInstruction {
    pub fn unpack(instruction_data: &[u8]) -> Result<Self, ProgramError> {
        let (&tag, rest) = instruction_data.split_first().ok_or(InvalidInstruction)?;
        Ok(match tag {
            0 => {
                let (stake_amount, rest) = rest.split_at(8);
                let stake_amount = stake_amount
                    .try_into()
                    .ok()
                    .map(u64::from_le_bytes)
                    .ok_or(InvalidInstruction)?;
                let time = rest
                    .try_into()
                    .ok()
                    .map(u64::from_le_bytes)
                    .ok_or(InvalidInstruction)?;
                Self::Stake {
                    amount: stake_amount,
                    time_of_stake: time,
                }
            }
            1 => Self::Unstake,
            3 => Self::ClaimReward,
            9 => Self::WithdrawPool,
            4 => {
                let (owner, rest) = rest.split_at(32);
                let owner = Pubkey::new(owner);
                let (time, rest) = rest.split_at(8);
                let locking_time = time
                    .try_into()
                    .ok()
                    .map(u64::from_le_bytes)
                    .ok_or(InvalidInstruction)?;
                let apr = rest
                    .get(..8)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u64::from_le_bytes)
                    .ok_or(InvalidInstruction)?;
                Self::InitializePlatform {
                    owner,
                    locking_time,
                    apr,
                }
            }
            8 => Self::RefundStakers,
            11 => {
                let stake_amount = rest
                    .get(..8)
                    .and_then(|slice| slice.try_into().ok())
                    .map(u64::from_le_bytes)
                    .ok_or(InvalidInstruction)?;

                Self::AddTokenToPools {
                    token_amount: stake_amount,
                }
            }
            _ => return Err(InvalidInstruction.into()),
        })
    }
}
