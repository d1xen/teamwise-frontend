// src/pages/LandingPage.tsx
import PageContainer from "../components/layout/PageContainer";

export default function LandingPage() {
    const handleLogin = () => {
        window.location.href = "http://localhost:8080/api/auth/steam";
    };

    return (
        <PageContainer>
            <div className="text-center space-y-6">
                <h1 className="text-4xl font-extrabold text-white">TeamWise</h1>
                <p className="text-lg text-gray-300">Rejoignez ou créez votre équipe Counter-Strike.</p>
                <button
                    onClick={handleLogin}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition"
                >
                    Se connecter via Steam
                </button>
            </div>
        </PageContainer>
    );
}
