import { useCallback, useEffect, useState } from "react";
import {
  approveInsight,
  createInsight,
  deleteInsight,
  getAuditLog,
  getConsensusState,
  getInsights,
  INSIGHTS_CHANGED_EVENT,
  publishForecast,
  rejectInsight,
  updateInsight,
} from "./store";
import type { CollaborativeInsight, InsightFormInput } from "./types";

export function useInsights() {
  const [insights, setInsights] = useState<CollaborativeInsight[]>(() =>
    typeof window !== "undefined" ? getInsights() : [],
  );
  const [auditLog, setAuditLog] = useState(() =>
    typeof window !== "undefined" ? getAuditLog() : [],
  );

  const refresh = useCallback(() => {
    setInsights(getInsights());
    setAuditLog(getAuditLog());
  }, []);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(INSIGHTS_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(INSIGHTS_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  return {
    insights,
    auditLog,
    refresh,
    createInsight: (input: InsightFormInput, userName: string) => {
      const r = createInsight(input, userName);
      refresh();
      return r;
    },
    updateInsight: (
      id: string,
      patch: Partial<InsightFormInput>,
      userName: string,
    ) => {
      const r = updateInsight(id, patch, userName);
      refresh();
      return r;
    },
    deleteInsight: (id: string, userName: string) => {
      const r = deleteInsight(id, userName);
      refresh();
      return r;
    },
    approveInsight: (id: string, userName: string) => {
      const r = approveInsight(id, userName);
      refresh();
      return r;
    },
    rejectInsight: (id: string, userName: string) => {
      const r = rejectInsight(id, userName);
      refresh();
      return r;
    },
    publishForecast: (skuCode: string, userName: string, productName: string) => {
      const r = publishForecast(skuCode, userName, productName);
      refresh();
      return r;
    },
    getPublishState: (skuCode: string) => getConsensusState(skuCode),
  };
}
