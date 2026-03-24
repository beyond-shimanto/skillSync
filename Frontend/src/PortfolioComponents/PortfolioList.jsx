import { useContext, useEffect, useState } from "react";
import { apiContext } from "../ApiContext";
import './PortfolioList.css';

export function PortfolioList() {
    const { api } = useContext(apiContext);
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPortfolios() {
            try {
                const res = await api.get('/portfolios');
                setPortfolios(res.data);
            } catch (e) {
                console.error('Error fetching portfolios:', e);
            } finally {
                setLoading(false);
            }
        }
        fetchPortfolios();
    }, [api]);

    if (loading) return <div>Loading portfolios...</div>;

    return (
        <div className="portfolio-list">
            <h2>All Portfolios</h2>
            {portfolios.length === 0 ? (
                <p>No portfolios available.</p>
            ) : (
                <div className="portfolios-grid">
                    {portfolios.map(portfolio => (
                        <div key={portfolio._id} className="portfolio-card">
                            <h3>{portfolio.title}</h3>
                            <p>{portfolio.description}</p>
                            <p>By: {portfolio.userId.username}</p>
                            <p>Uploaded: {new Date(portfolio.createdAt).toLocaleDateString()}</p>
                            <a href={'https://' + String(portfolio.url)} target="_blank" rel="noopener noreferrer">View Portfolio</a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}