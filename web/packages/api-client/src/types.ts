export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface ApiErrorBody {
  code: number;
  reason: string;
  extra_info: Record<string, unknown>;
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, fallback: string) {
    super(body?.reason ?? fallback);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface UserOut {
  user_id: number;
  email: string;
  firstname: string;
  lastname: string | null;
  contact: string | null;
  photo_url: string | null;
  gender: "M" | "F" | "U";
  blood_type: string | null;
  level_id: number;
  level: string | null;
  status: number;
  register_date: string;
  latitude: number | null;
  longitude: number | null;
}

export interface UserList {
  users: UserOut[];
  count: number;
}

export interface UserCreate {
  email: string;
  password: string;
  firstname: string;
  lastname?: string | null;
  contact?: string | null;
  gender?: "M" | "F" | "U";
  blood_type?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type UserUpdate = Partial<
  Pick<
    UserCreate,
    "email" | "firstname" | "lastname" | "contact" | "gender" | "blood_type" | "latitude" | "longitude"
  >
> & { photo_url?: string | null };

export interface DonorSummary {
  user_id: number;
  firstname: string;
  lastname: string | null;
  contact: string | null;
  email: string;
}

export interface DonationRequestOut {
  request_id: number;
  user_id: number;
  blood_type: string;
  notes: string | null;
  requisite_number: number;
  status: number;
  request_date: string;
  accepted_count: number;
  latitude: number | null;
  longitude: number | null;
  requester: DonorSummary | null;
}

export interface DonationRequestList {
  donations: DonationRequestOut[];
  count: number;
}

export interface DonationRequestCreate {
  blood_type: string;
  notes?: string | null;
  requisite_number?: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface OfferOut {
  offer_id: number;
  request_id: number;
  donor_id: number;
  status: number;
  offered_at: string;
  updated_at: string;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface GeoCell {
  cell_id: string;
  resolution: number;
  center: LatLng;
  boundary: LatLng[];
}

export interface GeoDisk {
  origin: GeoCell;
  resolution: number;
  distance_m: number;
  k: number;
  cell_count: number;
  total_cells: number;
  truncated: boolean;
  cells: GeoCell[];
}

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const OFFER_STATUS: Record<number, string> = {
  0: "offered",
  1: "accepted",
  2: "declined",
  3: "accomplished",
};

export const REQUEST_STATUS: Record<number, string> = {
  0: "open",
  1: "fulfilled",
  2: "cancelled",
};

export interface BloodTypeCount {
  blood_type: string;
  donors: number;
}

export interface LevelOut {
  level_id: number;
  name: string;
  min_score: number;
}

export interface StatsOverview {
  open_requests: number;
  pending_offers: number;
  accomplished_offers: number;
  donors_by_blood_type: BloodTypeCount[];
}
