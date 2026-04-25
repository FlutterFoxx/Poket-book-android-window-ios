import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { Users, TrendingDown, TrendingUp, Activity, BookOpen, ArrowRight, RefreshCw } from "lucide-react";

const StatCard = ({ title, value, colorClass, bgClass, icon: Icon, testId }) => (
  <div className={`bg-white border border-stone-200 rounded-lg p-5 ${bgClass}`} data-testid={testId}>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-stone-500 font-medium uppercase tracking-wide mb-1">{title}</p>
        <p className={`text-xl font-bold font-mono ${colorClass}`}>{value}</p>
      </div>
      <div className={`p-2 rounded-md ${bgClass || "bg-stone-100"}`}><Icon size={18} className={colorClass} /></div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bs, setBs] = useState(null);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bsRes, partiesRes] = await Promise.all([api.get("/api/balance-sheet"), api.get("/api/parties")]);
      setBs(bsRes.data);
      setParties(partiesRes.data.slice(0, 8));
    } catch (err) {
      // Non-critical failure — dashboard degrades gracefully with empty state
      if (err.response?.status !== 401) toast.error("Dashboard load nahi hua");
    }
    setLoading(false);
  }, []); // api, toast, state setters are stable module-level refs — intentional empty deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n || 0));

  return (
    <div className="p-4 sm:p-8">
      <div className="flex items-center justify-between mb-5 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Namaste, {user?.name?.split(" ")[0]} Ji</h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-0.5">Aaj ka overview — {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
        </div>
        <button onClick={fetchData} className="flex items-center gap-2 text-xs sm:text-sm text-stone-600 hover:text-stone-900 border border-stone-200 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md bg-white transition-colors" data-testid="dashboard-refresh-btn">
          <RefreshCw size={14} /> <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4 mb-8">{[1,2,3,4].map((i) => <div key={i} className="bg-white border border-stone-200 rounded-lg p-5 animate-pulse"><div className="h-3 bg-stone-100 rounded w-20 mb-3"/><div className="h-6 bg-stone-100 rounded w-32"/></div>)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard title="Kul Parties" value={parties.length} colorClass="text-stone-800" bgClass="" icon={Users} testId="stat-total-parties" />
          <StatCard title="Lena Hai (Receivable)" value={`₹${fmt(bs?.total_receivable)}`} colorClass="text-green-700" bgClass="bg-green-50" icon={TrendingDown} testId="stat-total-receivable" />
          <StatCard title="Dena Hai (Payable)" value={`₹${fmt(bs?.total_payable)}`} colorClass="text-red-700" bgClass="bg-red-50" icon={TrendingUp} testId="stat-total-payable" />
          <StatCard title="Net Balance" value={`₹${fmt(bs?.net_balance)}`} colorClass={bs?.net_balance < 0 ? "text-green-700" : bs?.net_balance > 0 ? "text-red-700" : "text-stone-600"} bgClass="" icon={Activity} testId="stat-net-balance" />
        </div>
      )}

      <div className="bg-white border border-stone-200 rounded-lg">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-900">Parties / Khatadar</h2>
          <Link to="/parties" className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1">Sab dekhein <ArrowRight size={12} /></Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map((i) => <div key={i} className="h-8 bg-stone-50 rounded animate-pulse"/>)}</div>
        ) : parties.length === 0 ? (
          <div className="p-10 text-center">
            <Users size={32} className="text-stone-300 mx-auto mb-3" />
            <p className="text-sm text-stone-500 mb-4">Abhi koi party nahi hai</p>
            <Link to="/parties" className="inline-flex items-center gap-2 bg-stone-900 text-white text-sm px-4 py-2 rounded-md hover:bg-stone-800">
              <Users size={14} /> Pehli party add karein
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="dashboard-parties-table">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Naam</th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Mobile</th>
                  <th className="text-right px-5 py-2.5 text-xs font-semibold text-stone-500 uppercase tracking-wide">Balance</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {parties.map((p) => {
                  const bal = formatBalance(p.current_balance);
                  return (
                    <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50" data-testid={`party-row-${p.id}`}>
                      <td className="px-5 py-3 text-sm font-medium text-stone-900">{toTitleCase(p.name)}</td>
                      <td className="px-5 py-3 text-sm text-stone-500 font-mono">{p.mobile || "—"}</td>
                      <td className="px-5 py-3 text-right"><span className={`text-sm font-mono font-semibold ${bal.colorClass}`}>{bal.text}</span></td>
                      <td className="px-5 py-3 text-right">
                        <button onClick={() => navigate(`/ledger/${p.id}`)} className="text-xs text-amber-700 hover:text-amber-900 flex items-center gap-1 ml-auto" data-testid={`view-ledger-${p.id}`}>
                          <BookOpen size={12} /> Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
