import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "@/i18n";
import { useAuth } from "@/store";
import { AuthGate } from "./AuthGate";

const ui = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={["/planner"]}>
        <AuthGate feature="planner"><p>secret plan</p></AuthGate>
      </MemoryRouter>
    </I18nextProvider>,
  );

describe("AuthGate", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    useAuth.setState({ user: null });
  });

  it("explains why an account is needed and keeps the feature hidden", () => {
    ui();
    expect(screen.queryByText("secret plan")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /sign in to use the meal planner/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create a free account/i })).toHaveAttribute("href", "/register?next=%2Fplanner");
  });

  it("shows the feature to signed-in users", () => {
    useAuth.setState({ user: { id: "u1", name: "A", phone: "250788000000", role: "customer" } });
    ui();
    expect(screen.getByText("secret plan")).toBeInTheDocument();
  });
});
