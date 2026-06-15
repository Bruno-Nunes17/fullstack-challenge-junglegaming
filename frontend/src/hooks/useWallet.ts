import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";
import { useAuth } from "react-oidc-context";
import { useEffect } from "react";
import { socketService } from "../services/socket";

export function useWallet() {
  const auth = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const res = await api.get("/wallets/me", {
        headers: { Authorization: `Bearer ${auth.user?.access_token}` },
      });
      return res.data;
    },
    enabled: !!auth.isAuthenticated,
  });

  useEffect(() => {
    if (!auth.isAuthenticated) return;

    socketService.connect();

    const handleUpdate = (data: { playerId: string }) => {
      if (data.playerId === auth.user?.profile.sub) {
        queryClient.invalidateQueries({ queryKey: ["wallet"] });
      }
    };

    socketService.on<{ playerId: string }>("balance_updated", handleUpdate);

    return () => {
      socketService.off("balance_updated");
    };
  }, [auth.isAuthenticated, auth.user?.profile.sub, queryClient]);

  return query;
}
