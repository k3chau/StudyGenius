import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  return (
    !isAuthenticated && (
      <Button 
        onClick={() => loginWithRedirect({
          appState: { returnTo: '/study' }
        })}
        variant="default"
      >
        Sign In
      </Button>
    )
  )
}

export default LoginButton 