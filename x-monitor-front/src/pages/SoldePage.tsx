import { useEffect, useState } from 'react';
import useSoldeStore from '../store/useSoldeStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { parseISO } from 'date-fns';
import { Plus, Edit, Trash2, RefreshCcw, Wallet } from 'lucide-react';

const SoldePage = () => {
    const {
        currentSolde,
        currentSoldeId,
        soldes,
        fetchCurrentSolde,
        fetchAllSoldes,
        updateSolde,
        isLoading,
        createSolde
    } = useSoldeStore();

    const [formData, setFormData] = useState({
        montant: '',
        operation: 'ajout',
        description: '',
        reference: ''
    });
    const [activeTab, setActiveTab] = useState('current');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        mois: format(new Date(), 'yyyy-MM'),
        soldeInitial: '',
        description: ''
    });

    useEffect(() => {
        fetchCurrentSolde();
        fetchAllSoldes();
    }, [fetchCurrentSolde, fetchAllSoldes]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCreateFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentSoldeId) return;
        await updateSolde(currentSoldeId, {
            montant: Number(formData.montant),
            operation: formData.operation as 'ajout' | 'retrait',
            description: formData.description,
            reference: formData.reference
        });
        setFormData({
            montant: '',
            operation: 'ajout',
            description: '',
            reference: ''
        });
        setShowAddForm(false);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createSolde({
                ...createFormData,
                soldeInitial: Number(createFormData.soldeInitial)
            });
            setShowCreateForm(false);
            setCreateFormData({
                mois: format(new Date(), 'yyyy-MM'),
                soldeInitial: '',
                description: ''
            });
        } catch (error) {
            console.error('Erreur lors de la création du solde:', error);
        }
    };

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return 'Non défini';
        try {
            const date = parseISO(dateString);
            return format(date, "dd MMMM yyyy 'à' HH:mm", { locale: fr as unknown as Locale });
        } catch (error) {
            return 'Date invalide';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestion des soldes</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="btn btn-secondary"
                    >
                        {showCreateForm ? 'Annuler' : 'Créer un solde'}
                    </button>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="btn btn-primary"
                    >
                        {showAddForm ? 'Annuler' : 'Nouvelle opération'}
                    </button>
                </div>
            </div>

            {/* Create Solde Form (Modal-like) */}
            {showCreateForm && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">Créer un nouveau solde</h2>
                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Mois</span>
                                    </label>
                                    <input
                                        type="month"
                                        name="mois"
                                        value={createFormData.mois}
                                        onChange={handleCreateInputChange}
                                        className="input input-bordered w-full"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Solde initial (AR)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="soldeInitial"
                                        value={createFormData.soldeInitial}
                                        onChange={handleCreateInputChange}
                                        placeholder="Entrez le solde initial"
                                        className="input input-bordered w-full"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Description (optionnel)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="description"
                                        value={createFormData.description}
                                        onChange={handleCreateInputChange}
                                        placeholder="Description du solde"
                                        className="input input-bordered w-full"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateForm(false)}
                                    className="btn btn-ghost"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Création...' : 'Créer le solde'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add/Remove Form (Modal-like) */}
            {showAddForm && currentSolde && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title">
                            {formData.operation === 'ajout' ? 'Ajouter un montant' : 'Retirer un montant'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Opération</span>
                                    </label>
                                    <select
                                        name="operation"
                                        value={formData.operation}
                                        onChange={handleInputChange}
                                        className="select select-bordered w-full"
                                    >
                                        <option value="ajout">Ajout</option>
                                        <option value="retrait">Retrait</option>
                                    </select>
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Montant (AR)</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="montant"
                                        value={formData.montant}
                                        onChange={handleInputChange}
                                        placeholder="Entrez le montant"
                                        className="input input-bordered w-full"
                                        step="0.01"
                                        min="0.01"
                                        required
                                    />
                                </div>
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Référence</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="reference"
                                        value={formData.reference}
                                        onChange={handleInputChange}
                                        placeholder="Référence (optionnel)"
                                        className="input input-bordered w-full"
                                    />
                                </div>
                                <div className="form-control md:col-span-2">
                                    <label className="label">
                                        <span className="label-text">Description</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Description de l'opération"
                                        className="textarea textarea-bordered w-full"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="btn btn-ghost"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs tabs-boxed bg-base-100 mb-6">
                <button
                    className={`tab ${activeTab === 'current' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('current')}
                >
                    Solde actuel
                </button>
                <button
                    className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    Historique
                </button>
            </div>

            {/* Content */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    {activeTab === 'current' ? (
                        <div>
                            {currentSolde ? (
                                <div>
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                                        <div>
                                            <h2 className="text-xl font-semibold">
                                                Solde du {format(new Date(currentSolde.mois + '-01'), 'MMMM yyyy', { locale: fr })}
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                Dernière mise à jour: {formatDate(currentSolde.updatedAt)}
                                            </p>
                                        </div>
                                        <div className="text-right mt-4 md:mt-0">
                                            <div className="text-3xl font-bold text-primary">
                                                {currentSolde.soldeActuel.toFixed(2)} AR
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Solde initial: {currentSolde?.soldeInitial?.toFixed(2) || 0} AR
                                            </div>
                                        </div>
                                    </div>
                                    <div className="divider">Dernières opérations</div>
                                    {currentSolde.historique && currentSolde.historique.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="table w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Description</th>
                                                        <th>Référence</th>
                                                        <th className="text-right">Montant</th>
                                                        <th>Type</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {currentSolde.historique
                                                        .sort((a, b) =>
                                                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                                                        )
                                                        .slice(0, 5)
                                                        .map((op, index) => (
                                                            <tr key={op._id || index}>
                                                                <td>{formatDate(op.createdAt)}</td>
                                                                <td>{op.description || 'N/A'}</td>
                                                                <td>{op.reference || 'N/A'}</td>
                                                                <td className={`text-right font-medium ${op.operation === 'ajout' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    {op.operation === 'ajout' ? '+' : '-'}{op.montant.toFixed(2)} AR
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${op.operation === 'ajout' ? 'badge-success' : 'badge-error'}`}>
                                                                        {op.operation === 'ajout' ? 'Ajout' : 'Retrait'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Aucune opération enregistrée pour le moment.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">Aucun solde disponible pour le moment.</p>
                                    <button
                                        className="btn btn-primary mt-4"
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                        Créer un nouveau solde
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-xl font-semibold mb-4">Historique des soldes</h2>
                            {soldes.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table w-full">
                                        <thead>
                                            <tr>
                                                <th>Mois</th>
                                                <th>Solde initial</th>
                                                <th>Solde final</th>
                                                <th>Statut</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {soldes.map((solde) => (
                                                <tr key={solde._id}>
                                                    <td>{format(new Date(solde.mois + '-01'), 'MMMM yyyy', { locale: fr })}</td>
                                                    <td>{solde.soldeInitial.toFixed(2)} AR</td>
                                                    <td>{solde.soldeActuel.toFixed(2)} AR</td>
                                                    <td>
                                                        <span className={`badge ${solde.statut === 'actif' ? 'badge-success' : 'badge-warning'}`}>
                                                            {solde.statut === 'actif' ? 'Actif' : 'Clôturé'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="btn btn-ghost btn-xs"
                                                        >
                                                            Voir détails
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    Aucun historique de solde disponible.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SoldePage;
