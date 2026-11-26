import {useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/lib/useAuth';

export const useLogoutUser = () =>
{
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    // Goes through the shared auth state so the header etc. update immediately
    const { logout } = useAuth();

    const logoutUserAccount = async () => {
        
        try
        {
            await logout();
            navigate("/"); // Redirect to home page after logout
        }
        catch(error)
        {
            setError(error.message)
        }
    };

    return {logoutUserAccount, error}
}