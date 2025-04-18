import LoginButton from "../components/LoginButton";
import LogoutButton from "../components/LogoutButton";

function App() {
  return (
    <main className="column">
      <h1>Auth0 Login</h1>
      <LoginButton />
      <LogoutButton />
    </main>
  );
}

export default App; 