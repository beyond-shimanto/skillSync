import { useContext, useEffect, useState } from "react";
import { apiContext } from "../ApiContext";
import { Link } from "react-router-dom";
import './MyPortfolios.css';

export function MyPortfolios() {
    const { api } = useContext(apiContext);
    const [portfolios, setPortfolios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyPortfolios();
    }, [api]);

    const fetchMyPortfolios = async () => {
        try {
            const res = await api.get('/portfolios/my');
            setPortfolios(res.data);
        } catch (e) {
            console.error('Error fetching my portfolios:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this portfolio?')) return;
        try {
            await api.delete(`/portfolios/${id}`);
            setPortfolios(portfolios.filter(p => p._id !== id));
        } catch (e) {
            alert('Failed to delete portfolio');
        }
    };

    if (loading) return <div>Loading your portfolios...</div>;

    return (
        <div className="my-portfolios">
            <h2>My Portfolios</h2>
            <Link to="/portfolios/upload">Upload New Portfolio</Link>
            {portfolios.length === 0 ? (
                <p>You have no portfolios. <Link to="/portfolios/upload">Upload one!</Link></p>
            ) : (
                <div className="portfolios-grid">
                    {portfolios.map(portfolio => (
                        <div key={portfolio._id} className="portfolio-card">
                            <h3>{portfolio.title}</h3>
                            <p>{portfolio.description}</p>
                            <p>Uploaded: {new Date(portfolio.createdAt).toLocaleDateString()}</p>
                            <a href={portfolio.url} target="_blank" rel="noopener noreferrer">View Portfolio</a>
                            <button onClick={() => handleDelete(portfolio._id)}>Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}