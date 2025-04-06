import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";

const LogoutButton = () => {
  const { logout, isAuthenticated } = useAuth0();

  return (
    isAuthenticated && (
      <Button 
        onClick={() => logout({ 
          logoutParams: { 
            returnTo: window.location.origin 
          }
        })}
        variant="outline"
      >
        Sign Out
      </Button>
    )
  )
}

export default LogoutButton 