import { Link } from "react-router-dom";
import { X, AlertTriangle, Clock } from "lucide-react";
import { useState } from "react";

const SubscriptionBanner = ({ subscription }) => {
  const [dismissed, setDismissed] = useState(false);
  if (!subscription || dismissed) return null;

  const { is_active, days_remaining, type } = subscription;

  if (is_active && days_remaining > 5) return null;

  const isExpired = !is_active || days_remaining <= 0;
  const isWarning = is_active && days_remaining <= 5 && days_remaining > 0;

  if (!isExpired && !isWarning) return null;

  return (
    <div className={`flex items-center justify-between px-4 py-2 text-sm font-medium text-white ${isExpired ? "bg-red-600" : "bg-amber-500"}`}>
      <div className="flex items-center gap-2">
        {isExpired ? <AlertTriangle size={16} /> : <Clock size={16} />}
        {isExpired
          ? <span>Your {type} plan has expired. Please upgrade to continue using poketbook.</span>
          : <span>FREE Trial expires in <strong>{days_remaining} days</strong>. Upgrade now to keep access.</span>
        }
        <a href="/#pricing" className="ml-2 underline font-bold hover:no-underline">View Plans →</a>
      </div>
      <button onClick={() => setDismissed(true)} className="ml-4 hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
};

export default SubscriptionBanner;
