
import { Form, Button, Alert, Container } from "react-bootstrap";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginScreen() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("danger");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setLoading(true);

        try {
            const response = await axios.post("/api/login/", {
                username,
                password,
            });

            localStorage.setItem("userData", JSON.stringify(response.data));

            window.dispatchEvent(new Event("storage"));

            setMessageType("success");
            setMessage("Login successful!");

            setTimeout(() => {
                navigate("/");
            }, 1000);

        } catch (error) {
            setMessageType("danger");
            setMessage(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Invalid username or password. Please try again."
            );

            console.error(
                "Login error:",
                error.response?.data || error.message
            );
        } finally {
            setLoading(false);
            setPassword("");
        }
    };

    return (
        <Container className="mt-4" style={{ maxWidth: "500px" }}>
            <h2>Login</h2>

            {message && (
                <Alert variant={messageType}>
                    {message}
                </Alert>
            )}

            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="formBasicUsername" className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </Form.Group>

                <Form.Group controlId="formBasicPassword" className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </Form.Group>

                <Button
                    variant="primary"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </Button>
            </Form>
        </Container>
    );
}

export default LoginScreen;
