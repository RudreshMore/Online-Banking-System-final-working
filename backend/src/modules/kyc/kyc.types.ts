export interface RequestedChanges {
  name?: string;
  aadhaarNumber?: string;
  dob?: string;
  photoUrl?: string;
}

export interface CreateKycRequestDto {
  requestedChanges: RequestedChanges;
  reason: string;
  proofDocument?: string;
}

export interface ReviewKycRequestDto {
  status: "APPROVED" | "REJECTED";
  adminComment?: string;
}
