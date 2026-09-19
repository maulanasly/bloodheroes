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
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Nav,
  Page,
  RequireAuth,
  SkeletonList,
  useAuth,
  useToast,
} from "@bloodheroes/ui";

const OWNER_ACTIONS: Record<number, string> = {
  1: "Accept",
  2: "Decline",
  3: "Mark accomplished",
};

export default function ClientRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { client, user, logout } = useAuth();
  const { notify } = useToast();
  const [request, setRequest] = useState<DonationRequestOut | null>(null);
  const [offers, setOffers] = useState<OfferOut[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [offering, setOffering] = useState(false);
  const [pendingOffer, setPendingOffer] = useState<number | null>(null);
  const [confirm, setConfirm] = useState<{ offerId: number; status: number } | null>(null);

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
      const message = err instanceof Error ? err.message : "Failed to load request";
      setError(message);
      notify(message, "error");
    } finally {
      setLoading(false);
    }
  }, [client, id, notify]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = request != null && user != null && request.user_id === user.user_id;

  async function offer() {
    setError(null);
    setOffering(true);
    try {
      await createOffer(client, Number(id));
      notify("Offer sent — thank you for donating!", "success");
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send offer";
      setError(message);
      notify(message, "error");
    } finally {
      setOffering(false);
    }
  }

  async function confirmStatusChange() {
    if (!confirm) return;
    setPendingOffer(confirm.offerId);
    setError(null);
    try {
      const updated = await updateOffer(client, confirm.offerId, confirm.status);
      setOffers((prev) => prev.map((o) => (o.offer_id === updated.offer_id ? updated : o)));
      setRequest(await getDonationRequest(client, Number(id)));
      notify(`Offer #${confirm.offerId} ${OFFER_STATUS[confirm.status]}.`, "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update offer";
      setError(message);
      notify(message, "error");
    } finally {
      setPendingOffer(null);
      setConfirm(null);
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
        {loading || !request ? (
          <SkeletonList rows={5} />
        ) : (
          <>
            <Card title={`${request.blood_type} × ${request.requisite_number}`}>
              <p>
                <Badge tone="blue">{REQUEST_STATUS[request.status] ?? request.status}</Badge>{" "}
                accepted {request.accepted_count} of {request.requisite_number}
              </p>
              {request.notes && <p>{request.notes}</p>}
              {!isOwner && (
                <Button onClick={() => void offer()} loading={offering}>
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
                          {[1, 2, 3].map((s) => (
                            <span key={s}>
                              <Button
                                variant="ghost"
                                disabled={pendingOffer !== null || o.status === s}
                                onClick={() => setConfirm({ offerId: o.offer_id, status: s })}
                              >
                                {pendingOffer === o.offer_id ? "Working…" : OWNER_ACTIONS[s]}
                              </Button>{" "}
                            </span>
                          ))}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
        {confirm && (
          <Modal
            title={`${OWNER_ACTIONS[confirm.status]} offer #${confirm.offerId}?`}
            confirmLabel={OWNER_ACTIONS[confirm.status]}
            danger={confirm.status === 2}
            busy={pendingOffer !== null}
            onConfirm={() => void confirmStatusChange()}
            onClose={() => (pendingOffer === null ? setConfirm(null) : undefined)}
          >
            <p style={{ margin: 0 }}>
              {confirm.status === 1 && "The donor will be counted toward this request."}
              {confirm.status === 2 && "The donor will be notified the offer was declined."}
              {confirm.status === 3 && "This marks the donation as completed and updates the donor's level."}
            </p>
          </Modal>
        )}
      </Page>
    </RequireAuth>
  );
}
