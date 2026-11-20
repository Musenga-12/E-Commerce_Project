import { beforeEach, describe, expect, it } from "vitest";
import { useAuth, useOrders } from "./index";

const place = () =>
  useOrders.getState().place({
    userId: "u1", district: "Gasabo", fulfilment: "delivery", address: "KG 1 Ave, Kimironko", phone: "250788123456", channel: "web",
    lines: [{ productId: "p-tomato", sellerId: "s1", qty: 2 }, { productId: "p-chicken", sellerId: "s4", qty: 1 }],
  });

describe("orders and payments (mock backend)", () => {
  beforeEach(() => useOrders.setState({ orders: [] }));

  it("totals are integers and include each seller's delivery fee", () => {
    const o = place();
    expect(o.sellerOrders).toHaveLength(2);
    expect(Number.isInteger(o.total)).toBe(true);
    expect(o.total).toBe(o.subtotal + o.deliveryTotal);
    expect(o.status).toBe("pending_payment");
  });
  it("refuses a second attempt while one is pending (no double charge)", () => {
    const o = place();
    expect(useOrders.getState().startPayment(o.id, "mtn", "250788123456")).not.toBeNull();
    expect(useOrders.getState().startPayment(o.id, "mtn", "250788123456")).toBeNull();
  });
  it("is idempotent: a duplicate callback cannot change a final status", () => {
    const o = place();
    const a = useOrders.getState().startPayment(o.id, "airtel", "250731234567")!;
    useOrders.getState().resolvePayment(o.id, a.id, "successful");
    useOrders.getState().resolvePayment(o.id, a.id, "failed");
    useOrders.getState().resolvePayment(o.id, a.id, "successful");
    const after = useOrders.getState().orders[0];
    expect(after.payments[0].status).toBe("successful");
    expect(after.status).toBe("confirmed");
    expect(after.history.filter((h) => h.kind === "payment" && h.status === "successful")).toHaveLength(1);
  });
  it("keeps order status separate from payment status, and allows a retry after failure", () => {
    const o = place();
    const a = useOrders.getState().startPayment(o.id, "mtn", "250788123456")!;
    useOrders.getState().resolvePayment(o.id, a.id, "failed");
    expect(useOrders.getState().orders[0].status).toBe("pending_payment");
    expect(useOrders.getState().startPayment(o.id, "mtn", "250788123456")).not.toBeNull();
  });
  it("cannot start a payment on an order already paid", () => {
    const o = place();
    const a = useOrders.getState().startPayment(o.id, "mtn", "250788123456")!;
    useOrders.getState().resolvePayment(o.id, a.id, "successful");
    expect(useOrders.getState().startPayment(o.id, "mtn", "250788123456")).toBeNull();
  });
});

describe("accounts", () => {
  beforeEach(() => useAuth.setState({ accounts: [], user: null }));

  it("phone sign-in only works for registered numbers", async () => {
    expect(useAuth.getState().loginWithPhone("250788555555")).toBe("not_found");
    await useAuth.getState().register({ name: "Aline", phone: "250788555555" });
    useAuth.getState().logout();
    expect(useAuth.getState().loginWithPhone("250788555555")).toBe("ok");
  });
  it("stores a password hash, never the password", async () => {
    await useAuth.getState().register({ name: "Eric", phone: "250788666666", email: "eric@example.rw", password: "s3cret-pass" });
    expect(JSON.stringify(useAuth.getState().accounts)).not.toContain("s3cret-pass");
    useAuth.getState().logout();
    expect(await useAuth.getState().loginWithEmail("eric@example.rw", "wrong-pass")).toBe("invalid");
    expect(await useAuth.getState().loginWithEmail("eric@example.rw", "s3cret-pass")).toBe("ok");
  });
  it("rejects a duplicate phone number", async () => {
    await useAuth.getState().register({ name: "A", phone: "250788777777" });
    expect(await useAuth.getState().register({ name: "B", phone: "250788777777" })).toBe("exists");
  });
});
