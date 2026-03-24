import { useContext, useState } from "react";
import { apiContext } from "../ApiContext";
import { useNavigate } from "react-router-dom";
import './UploadPortfolio.css';

export function UploadPortfolio() {
    const { api } = useContext(apiContext);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description || !url) {
            setError('All fields are required');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/portfolios', { title, description, url });
            navigate('/portfolios/my');
        } catch (e) {
            setError('Failed to upload portfolio');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-portfolio">
            <h2>Upload Portfolio</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Portfolio URL:</label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={loading}>
                    {loading ? 'Uploading...' : 'Upload'}
                </button>
            </form>
        </div>
    );
}