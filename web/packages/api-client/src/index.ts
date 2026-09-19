import { ApiClient } from "./client";
import type {
  DonationRequestCreate,
  DonationRequestList,
  DonationRequestOut,
  GeoCell,
  GeoDisk,
  OfferOut,
  UserCreate,
  UserList,
  UserOut,
  UserUpdate,
} from "./types";

export * from "./types";
export { ApiClient, MemoryTokenStore, type TokenStore, type ApiClientOptions } from "./client";

export interface UserSearchParams {
  latitude?: number;
  longitude?: number;
  distance?: number;
  blood_type?: string;
  gender?: string;
  status?: number;
  page?: number;
  per_page?: number;
}

export interface RequestSearchParams {
  user_id?: number;
  giver?: boolean;
  blood_type?: string;
  status?: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
  page?: number;
  per_page?: number;
}

function toQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function registerUser(client: ApiClient, payload: UserCreate): Promise<UserOut> {
  return client.request<UserOut>("/v1/users", { method: "POST", body: payload, auth: false });
}

export async function listUsers(client: ApiClient, params: UserSearchParams = {}): Promise<UserList> {
  return client.request<UserList>(`/v1/users${toQuery(params as Record<string, string | number | boolean | undefined>)}`);
}

export async function getMe(client: ApiClient): Promise<UserOut> {
  return client.request<UserOut>("/v1/users/me");
}

export async function updateMe(client: ApiClient, payload: UserUpdate): Promise<UserOut> {
  return client.request<UserOut>("/v1/users/me", { method: "PUT", body: payload });
}

export async function getUser(client: ApiClient, userId: number): Promise<UserOut> {
  return client.request<UserOut>(`/v1/users/${userId}`);
}

export async function createDonationRequest(
  client: ApiClient,
  payload: DonationRequestCreate,
): Promise<DonationRequestOut> {
  return client.request<DonationRequestOut>("/v1/donations/requests", {
    method: "POST",
    body: payload,
  });
}

export async function listDonationRequests(
  client: ApiClient,
  params: RequestSearchParams = {},
): Promise<DonationRequestList> {
  return client.request<DonationRequestList>(
    `/v1/donations/requests${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
  );
}

export async function getDonationRequest(client: ApiClient, requestId: number): Promise<DonationRequestOut> {
  return client.request<DonationRequestOut>(`/v1/donations/requests/${requestId}`);
}

export async function createOffer(client: ApiClient, requestId: number): Promise<OfferOut> {
  return client.request<OfferOut>(`/v1/donations/requests/${requestId}/offers`, { method: "POST" });
}

export async function listOffers(client: ApiClient, requestId: number): Promise<OfferOut[]> {
  return client.request<OfferOut[]>(`/v1/donations/requests/${requestId}/offers`);
}

export async function updateOffer(client: ApiClient, offerId: number, status: number): Promise<OfferOut> {
  return client.request<OfferOut>(`/v1/donations/offers/${offerId}`, {
    method: "PATCH",
    body: { status },
  });
}

export async function donationHistory(
  client: ApiClient,
  params: { blood_type?: string; status?: number; page?: number; per_page?: number } = {},
): Promise<DonationRequestList> {
  return client.request<DonationRequestList>(
    `/v1/donations/history${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
  );
}

export async function getGeoCell(
  client: ApiClient,
  params: { latitude: number; longitude: number; resolution?: number },
): Promise<GeoCell> {
  return client.request<GeoCell>(
    `/v1/geo/cell${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
  );
}

export async function getGeoDisk(
  client: ApiClient,
  params: { latitude: number; longitude: number; distance?: number; resolution?: number; max_cells?: number },
): Promise<GeoDisk> {
  return client.request<GeoDisk>(
    `/v1/geo/disk${toQuery(params as Record<string, string | number | boolean | undefined>)}`,
  );
}
