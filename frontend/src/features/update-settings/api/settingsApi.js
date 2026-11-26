const API_BASE = import.meta.env.VITE_API_URL || '';

//GET ATHLETE PROFILE
export async function getAthleteProfile()
{
    const response = await fetch(`${API_BASE}/api/user/athlete/profile`, {
        method: "GET",
        credentials: "include"});

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Get athlete profile error response: ", errorData);
        throw new Error("Kunde inte hämta profilen, försök igen senare");
    }

    return await response.json();
}

//UPDATE ATHLETE DATA
export async function updateAthlete(profile) {
    const response = await fetch(`${API_BASE}/api/user/athlete/update`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profile)
    });

    if (!response.ok) {
    // Sends specific error data rather than sending a generic message
    const errorData = await response.json().catch(() => null);
    console.error("Update athlete error response: ", errorData);
    throw new Error("Ändringarna misslyckades, försök igen senare");
  }

    return await response.json();
}

//GET SPONSOR PROFILE
export async function getSponsorProfile()
{
    const response = await fetch(`${API_BASE}/api/user/sponsor/profile`, {
        method: "GET",
        credentials: "include"});

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Get athlete profile error response: ", errorData);
        throw new Error("Kunde inte hämta profilen, försök igen senare");
    }

    return await response.json();
}

//UPDATE SPONSOR DATA
export async function updateSponsor(profile) {
    const response = await fetch(`${API_BASE}/api/user/sponsor/update`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profile)
    });

    if (!response.ok) {
    // Sends specific error data rather than sending a generic message
    const errorData = await response.json().catch(() => null);
    console.error("Update sponsor error response: ", errorData);
    throw new Error("Ändringarna misslyckades, försök igen senare");
  }

    return await response.json();
}



//GET GUARDIAN DATA
export async function getGuardianData()
{
    const response = await fetch(`${API_BASE}/api/user/guardian`, {
        method: "GET",
        credentials: "include"});

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Get guardian data error response: ", errorData);
        throw new Error("Kunde inte hämta vårdnadshavarens data, försök igen senare");
    }

    return await response.json();
}

//UPDATE GUARDIAN DATA
export async function updateGuardian(guardian) {
    const response = await fetch(`${API_BASE}/api/guardian/update`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
    },    credentials: "include",
        body: JSON.stringify(guardian)
    });

    if (!response.ok) {
    // Sends specific error data rather than sending a generic message
    const errorData = await response.json().catch(() => null);
    console.error("Update guardian error response: ", errorData);
    throw new Error("Ändringarna misslyckades, försök igen senare");
  }
    return await response.json();
}



//GET ATHLETES SPORTS
export async function getAthleteSports()
{
    const response = await fetch(`${API_BASE}/api/users/me/sports`, {
        method: "GET",
        credentials: "include"}); 

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Get athlete sports error response: ", errorData);
        throw new Error("Kunde inte hämta dina sporter, försök igen senare");
    }

    return await response.json();
}

//UPDATE ATHLETE SPORTS
export async function updateAthleteSports(sports) {
    const response = await fetch(`${API_BASE}/api/users/me/sports`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
    },    credentials: "include",
        body: JSON.stringify({ sports })
    
    });
    if (!response.ok) {
    // Sends specific error data rather than sending a generic message
    const errorData = await response.json().catch(() => null);
    console.error("Update athlete sports error response: ", errorData);
    throw new Error("Ändringarna misslyckades, försök igen senare");
  }
}
//GET / UPDATE ANONYMITY
export async function getPrivacy() {
    const response = await fetch(`${API_BASE}/api/users/me/privacy`, { credentials: "include" });
    if (!response.ok) throw new Error(`Failed to load privacy settings: ${response.status}`);
    return response.json(); // { anonymous }
}

export async function updatePrivacy(anonymous) {
    const response = await fetch(`${API_BASE}/api/users/me/privacy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ anonymous }),
    });
    if (!response.ok) throw new Error(`Failed to save privacy settings: ${response.status}`);
    return response.json();
}

//CHANGE PASSWORD (ASP.NET Identity's built-in /manage/info endpoint)
export async function changePassword(currentPassword, newPassword) {
    const response = await fetch(`${API_BASE}/api/manage/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
    });

    if (!response.ok) {
        // Identity returns a validation problem: { errors: { PasswordMismatch: [...], PasswordTooShort: [...] } }
        const data = await response.json().catch(() => null);
        const codes = Object.keys(data?.errors ?? {});
        const error = new Error("Failed to change password");
        error.codes = codes;
        throw error;
    }
}

//DELETE ACCOUNT (permanent)
export async function deleteAccount() {
    const response = await fetch(`${API_BASE}/api/users/me`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!response.ok) throw new Error(`Failed to delete account: ${response.status}`);
}
