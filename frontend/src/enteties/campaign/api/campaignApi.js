import { mapCampaignFromApi } from '../model/types.js';

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function listCampaigns() 
{
    const response = await fetch(`${API_BASE}/api/donation-campaigns`);

    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) 
    {
        throw new Error(data.message ||"Failed to fetch campaigns");
    }

    return data.map(dto => mapCampaignFromApi(dto));
}

export async function listMyCampaigns() {
  const response = await fetch(`${API_BASE}/api/users/me/donation-campaigns`, {
    credentials: "include",
  });

  const data = await response.json().catch(() => []);

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch profile campaigns");
  }

  return data.map((dto) => mapCampaignFromApi(dto));
}

export async function getCampaignById(id) 
{
    // credentials: lets the API tell whether the viewer follows the athlete / owns the campaign
    const response = await fetch(`${API_BASE}/api/donation-campaigns/${id}`, { credentials: "include" });

    const data = await response.json().catch(() => ({}));
    
    if (response.status === 404)
    {
        return null;
    }

    if (!response.ok) 
    {
        throw new Error(data.message || "Failed to fetch campaign details");
    }
    
    return mapCampaignFromApi(data);
}