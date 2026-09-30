import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getPengajuan } from "../services/pendaftaran.service";

interface RuteStatusPesertaProps {
  statusDibutuhkan: string | string[];
  pesanDitolak: string;
}

const RuteStatusPeserta: React.FC<RuteStatusPesertaProps> = ({ statusDibutuhkan, pesanDitolak }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await getPengajuan();
        setStatus(res.data?.status || "belum_mulai");
      } catch {
        setStatus("belum_mulai");
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  if (loading) return null;

  const statusDiizinkan = Array.isArray(statusDibutuhkan) ? statusDibutuhkan.includes(status ?? "") : status === statusDibutuhkan;

  if (!statusDiizinkan) {
    const params = new URLSearchParams({ pesan: pesanDitolak });
    return <Navigate to={`/dashboard/peserta?${params.toString()}`} replace />;
  }

  return <Outlet />;
};

export default RuteStatusPeserta;
