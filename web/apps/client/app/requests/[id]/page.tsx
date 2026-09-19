"use client";

import { use, useCallback, useEffect, useState } from "react";

import {
  OFFER_STATUS,
  REQUEST_STATUS,
  createOffer,
  getDonationRequest,
  listOffers,
  updateOffer,
  type DonationRequestOut,
  type OfferOut,
} from "@bloodheroes/api-client";
import { Alert, Badge, Button, Card, EmptyState, Nav, Page, RequireAuth, useAuth } from "@bloodheroes/ui";

export default function ClientRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { client, user, logout } = useAuth();
  const [request, setRequest] = useState<DonationRequestOut | null>(null);
  const [offers, setOffers] = useState<OfferOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const isOwner = request != null && user != null && request.user_id === user.user_id;

  async function offer() {
    setError(null);
    setNotice(null);
    try {
      await createOffer(client, Number(id));
      setNotice("Offer sent.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send offer");
    }
  }

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
        brand="Bloodheroes"
        links={[
          { href: "/", label: "Discover" },
          { href: "/requests/new", label: "Request blood" },
          { href: "/history", label: "History" },
          { href: "/me", label: "Profile" },
        ]}
        onLogout={() => void logout()}
        email={user?.email ?? null}
      />
      <Page title={`Request #${id}`}>
        <Alert message={error} />
        {notice && <p style={{ color: "#15803d" }}>{notice}</p>}
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
              {!isOwner && (
                <Button onClick={() => void offer()}>
                  Offer to donate
                </Button>
              )}
            </Card>
            <Card title="Offers">
              {offers.length === 0 ? (
                <EmptyState message="No offers yet." />
              ) : (
                <ul>
                  {offers.map((o) => (
                    <li key={o.offer_id} style={{ marginBottom: "0.5rem" }}>
                      Offer #{o.offer_id} ·{" "}
                      <Badge tone={o.status === 1 ? "green" : o.status === 3 ? "blue" : "gray"}>
                        {OFFER_STATUS[o.status] ?? o.status}
                      </Badge>
                      {isOwner && (
                        <>
                          {" "}
                          <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 1)}>
                            Accept
                          </Button>{" "}
                          <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 2)}>
                            Decline
                          </Button>{" "}
                          <Button variant="ghost" onClick={() => void setOfferStatus(o.offer_id, 3)}>
                            Accomplish
                          </Button>
                        </>
                      )}
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
