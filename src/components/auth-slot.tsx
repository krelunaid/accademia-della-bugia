import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getUnreadCount } from "@/lib/server/updates";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    if (pathname === "/posto") {
      setUnread(0);
      return;
    }
    let cancelled = false;
    void getUnreadCount()
      .then((n) => {
        if (!cancelled) setUnread(n);
      })
      .catch(() => {
        if (!cancelled) setUnread(0);
      });
    return () => {
      cancelled = true;
    };
  }, [user, pathname]);

  if (isPending) {
    return <div className="size-11 animate-pulse rounded-full bg-cream/8" aria-hidden />;
  }
  if (!user) {
    return (
      <Link
        to="/login"
        search={{ redirect: "/posto" }}
        className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-cream/90 hover:bg-cream/8"
      >
        Entra
      </Link>
    );
  }

  const label = user.displayName ?? user.primaryEmail ?? "Iscritto";
  return (
    <Link to="/posto" className="relative grid size-11 place-items-center" aria-label={label}>
      {user.profileImageUrl ? (
        <img src={user.profileImageUrl} alt="" className="size-8 rounded-full object-cover" />
      ) : (
        <span className="grid size-8 place-items-center rounded-full bg-cream/12 text-xs font-medium text-cream">
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      {unread > 0 ? (
        <span className="absolute right-1 top-1 size-2 rounded-full bg-accent" aria-label={`${unread} novità`} />
      ) : null}
    </Link>
  );
}
