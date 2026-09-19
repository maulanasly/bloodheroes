"use client";

import { use, useCallback, useEffect, useState } from "react";

import {
  OFFER_STATUS,
  REQUEST_STATUS,
  getDonationRequest,
  listOffers,
  updateOffer,
  type DonationRequestOut,
  type OfferOut,
} from "@bloodheroes/api-client";
import { Alert, Badge, Button, Card, EmptyState, Nav, Page, RequireAuth, useAuth } from "@bloodheroes/ui";

export default function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { client, user, logout } = useAuth();
  const [request, setRequest] = useState<DonationRequestOut | null>(null);
  const [offers, setOffers] = useState<OfferOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const requestId = Number(id);
      const [detail, offerList] = await Promise.all([
        getDonationRequest(client, requestId),
        listOffers(client, requestId),
      ]);
      setRequest(detail);
      setOffers(offerList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load request");
    }
  }, [client, id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setOfferStatus(offerId: number, status: number) {
    setError(null);
    try {
      await updateOffer(client, offerId, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update offer");
    }
  }

  return (
    <RequireAuth>
      <Nav
        brand="Bloodheroes Ops"
        links={[
          { href: "/", label: "Map" },
          { href: "/requests", label: "Requests" },
          { href: "/donors", label: "Donors" },
        ]}
        onLogout={() => void logout()}
        email={user?.email ?? null}
      />
      <Page title={`Request #${id}`}>
        <Alert message={error} />
        {!request ? (
          <EmptyState message="Loading request…" />
        ) : (
          <>
            <Card title={`${request.blood_type} × ${request.requisite_number}`}>
              <p>
                <Badge tone="blue">{REQUEST_STATUS[request.status] ?? request.status}</Badge>{" "}
                accepted {request.accepted_count} of {request.requisite_number}
              </p>
              {request.notes && <p>{request.notes}</p>}
              <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Requester: {request.requester?.firstname} ({request.requester?.email}) ·{" "}
                {new Date(request.request_date).toLocaleString()}
              </p>
            </Card>
            <Card title={`Offers (${offers.length})`}>
              {offers.length === 0 ? (
                <EmptyState message="No offers yet." />
              ) : (
                <ul>
                  {offers.map((o) => (
                    <li key={o.offer_id} style={{ marginBottom: "0.5rem" }}>
                      Offer #{o.offer_id} · donor {o.donor_id} ·{" "}
                      <Badge tone={o.status === 1 ? "green" : o.status === 3 ? "blue" : o.status === 2 ? "gray" : "amber"}>
                        {OFFER_STATUS[o.status] ?? o.status}
                      </Badge>{" "}
                      <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 1)}>
                        Accept
                      </Button>{" "}
                      <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 2)}>
                        Decline
                      </Button>{" "}
                      <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 3)}>
                        Accomplish
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </Page>
    </RequireAuth>
  );
}
