import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getSession, getValidSession, saveSession } from '../services/authClient.js';
import ProfileDashboard from '../components/profile/ProfileDashboard.jsx';
import ProfileDetailView from '../components/profile/ProfileDetailView.jsx';
import ProfileEdit from '../components/profile/ProfileEdit.jsx';

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
});

const getInitials = (name) => name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

const parseApiResponse = async (response, defaultMessage) => {
    const contentType = response.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
        const raw = await response.text();
        throw new Error(`${defaultMessage}. El servidor devolvió contenido no JSON.`);
    }

    return response.json();
};

const Profile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [form, setForm] = useState({ nombre: '', titular: '', ubicacion: '', educacion: [], github: '', linkedin: '' });
    const [nuevaEducacion, setNuevaEducacion] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [bannerOffset, setBannerOffset] = useState({ x: 0, y: 0 });
    const [bannerZoom, setBannerZoom] = useState(1);
    const [avatarOffset, setAvatarOffset] = useState({ x: 0, y: 0 });
    const [draggingTarget, setDraggingTarget] = useState(null);
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const dragDataRef = useRef({ target: null, startX: 0, startY: 0, originX: 0, originY: 0 });

    const [isDraggingBanner, setIsDraggingBanner] = useState(false);
    const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
    const [misProductos, setMisProductos] = useState([]);
    const [misCompras, setMisCompras] = useState([]);
    const [activeSection, setActiveSection] = useState('productos');
    const [catalogFilter, setCatalogFilter] = useState('productos');
    const user = getSession()?.datosCliente || {};

    const isServiceProduct = (product) => String(product?.tipo || '').toLowerCase() === 'servicio';
    const publishedCount = misProductos.filter((p) => !isServiceProduct(p)).length;
    const activeServicesCount = misProductos.filter(isServiceProduct).length;
    const purchases = user?.totalPurchases ?? 0;
    const salesCount = user?.totalSales ?? (publishedCount * 3);

    const mockRating = 4.6;
    const mockReviews = 12;
    const sellerRating = user?.rating ?? mockRating;
    const sellerReviews = user?.reviewsCount ?? mockReviews;
    const sellerSales = salesCount;
    const catalogItems = misProductos.filter((product) => {
        if (catalogFilter === 'servicios') return isServiceProduct(product);
        return !isServiceProduct(product);
    });

    const searchParams = new URLSearchParams(location.search);
    const activeView = searchParams.get('view');
    const tabParam = searchParams.get('tab');
    const isDetailView = ['productos', 'servicios', 'compras', 'ventas'].includes(activeView || '');
    const isCatalogView = activeView === 'productos' || activeView === 'servicios' || tabParam === 'productos';
    const isEditMode = location.pathname === '/edit-profile' || tabParam === 'editar';

    const getActiveSession = async () => getValidSession();

    const cargarMisCompras = async () => {
        const session = await getActiveSession();
        if (!session?.accessToken) return;

        try {
            const response = await fetch('http://localhost:3000/api/productos/MisCompras', {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });
            const data = await parseApiResponse(response, 'No se pudieron cargar tus compras');
            if (data.codigo === 0) setMisCompras(data.compras || []);
        } catch (error) {
            console.log(error);
        }
    };

    const cargarMisProductos = async () => {
        const session = await getActiveSession();
        if (!session?.accessToken) {
            setFeedback({ type: 'error', message: 'Tu sesión expiró. Inicia sesión de nuevo para ver tus productos.' });
            return;
        }

        try {
            const response = await fetch('http://localhost:3000/api/productos/MisProductos', {
                headers: {
                    Authorization: `Bearer ${session.accessToken}`
                }
            });
            const data = await parseApiResponse(response, 'No se pudieron cargar tus productos');
            if (data.codigo === 0) {
                setMisProductos(data.productos || []);
                return;
            }

            throw new Error(data.mensaje || 'No se pudieron cargar tus productos');
        } catch (error) {
            console.log(error);

            try {
                const response = await fetch('http://localhost:3000/api/productos/ObtenerProductos');
                const data = await parseApiResponse(response, 'No se pudieron cargar tus productos');

                if (data.codigo === 0) {
                    const userId = session?.datosCliente?.id;
                    const propios = (data.productos || []).filter((p) => String(p.user_id || '') === String(userId || ''));
                    setMisProductos(propios);
                    if (!propios.length) {
                        setFeedback({ type: 'error', message: 'No se encontraron productos vinculados a tu cuenta actual.' });
                    }
                    return;
                }
            } catch (fallbackError) {
                console.log(fallbackError);
            }

            setFeedback({ type: 'error', message: 'No se pudieron cargar tus productos. Revisa tu sesión e inténtalo de nuevo.' });
        }
    };

    useEffect(() => {
        const session = getSession();
        if (!session) return;
        const d = session.datosCliente;
        setForm({
            nombre: d.nombre || '',
            titular: d.titular || '',
            ubicacion: d.ubicacion || '',
            educacion: d.educacion || [],
            github: d.github || '',
            linkedin: d.linkedin || ''
        });
        if (d.avatar) {
            setAvatarUrl(d.avatar);
            setAvatarOffset(d.avatar_offset || { x: 0, y: 0 });
        }
        if (d.banner) {
            setBannerUrl(d.banner);
            setBannerOffset(d.banner_offset || { x: 0, y: 0 });
            setBannerZoom(Number(d.banner_zoom) || 1);
        }

        cargarMisProductos();
        cargarMisCompras();
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const nextView = params.get('view');
        const nextTab = params.get('tab');

        if (location.pathname === '/edit-profile' || nextTab === 'editar') {
            setActiveSection('editar');
            return;
        }

        if (nextView === 'compras') {
            setActiveSection('compras');
            return;
        }

        setActiveSection('productos');

        if (nextView === 'servicios') {
            setCatalogFilter('servicios');
            return;
        }

        if (nextView === 'productos' || nextTab === 'productos') {
            setCatalogFilter('productos');
        }
    }, [location.pathname, location.search]);

    const handleEliminarProducto = async (idProducto) => {
        const session = await getActiveSession();
        if (!session?.accessToken) {
            setFeedback({ type: 'error', message: 'Debes iniciar sesión para eliminar productos.' });
            return;
        }

        const confirmado = window.confirm('¿Seguro que quieres eliminar esta publicación? Esta acción no se puede deshacer.');
        if (!confirmado) return;

        try {
            const response = await fetch('http://localhost:3000/api/productos/EliminarProducto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`
                },
                body: JSON.stringify({ id: idProducto })
            });
            const data = await parseApiResponse(response, 'No se pudo eliminar la publicación');

            if (data.codigo !== 0) {
                throw new Error(data.mensaje || 'No se pudo eliminar la publicación.');
            }

            setFeedback({ type: 'success', message: 'Publicación eliminada correctamente.' });
            setMisProductos((prev) => prev.filter((item) => String(item.id) !== String(idProducto)));
        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Error al eliminar publicación.' });
        }
    };

    useEffect(() => {
        const handleMouseMove = (event) => {
            const drag = dragDataRef.current;
            if (!drag.target) {
                return;
            }

            const nextX = drag.originX + (event.clientX - drag.startX);
            const nextY = drag.originY + (event.clientY - drag.startY);

            if (drag.target === 'banner') {
                setBannerOffset({ x: nextX, y: nextY });
            }

            if (drag.target === 'avatar') {
                setAvatarOffset({ x: nextX, y: nextY });
            }
        };

        const handleMouseUp = () => {
            dragDataRef.current = { target: null, startX: 0, startY: 0, originX: 0, originY: 0 };
            setDraggingTarget(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const onDragImageStart = (event, target) => {
        const origin = target === 'banner' ? bannerOffset : avatarOffset;
        dragDataRef.current = {
            target,
            startX: event.clientX,
            startY: event.clientY,
            originX: origin.x,
            originY: origin.y
        };
        setDraggingTarget(target);
    };

    const handleDragOver = (e, target) => {
        e.preventDefault();
        if (target === 'banner') setIsDraggingBanner(true);
        if (target === 'avatar') setIsDraggingAvatar(true);
    };

    const handleDragLeave = (e, target) => {
        e.preventDefault();
        if (target === 'banner') setIsDraggingBanner(false);
        if (target === 'avatar') setIsDraggingAvatar(false);
    };

    const onDropFile = async (event, target) => {
        event.preventDefault();
        if (target === 'banner') setIsDraggingBanner(false);
        if (target === 'avatar') setIsDraggingAvatar(false);
        
        const file = event.dataTransfer.files?.[0];

        if (!file || !file.type.startsWith('image/')) {
            setFeedback({ type: 'error', message: 'Solo se permiten imágenes para banner y foto de perfil.' });
            return;
        }

        try {
            const imageUrl = await readFileAsDataUrl(file);
            if (target === 'banner') {
                setBannerUrl(imageUrl);
                setBannerOffset({ x: 0, y: 0 });
                setBannerZoom(1);
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen lista para previsualizar. Arrástrala para encuadrar y guarda el perfil.' });
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        }
    };

    const onSelectFile = async (event, target) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            return;
        }

        try {
            const imageUrl = await readFileAsDataUrl(file);
            if (target === 'banner') {
                setBannerUrl(imageUrl);
                setBannerOffset({ x: 0, y: 0 });
                setBannerZoom(1);
            } else {
                setAvatarUrl(imageUrl);
                setAvatarOffset({ x: 0, y: 0 });
            }
            setFeedback({ type: 'success', message: 'Imagen lista para previsualizar. Arrástrala para encuadrar y guarda el perfil.' });
        } catch (error) {
            setFeedback({ type: 'error', message: error.message });
        } finally {
            event.target.value = '';
        }
    };

    const addEducacion = () => {
        const cleanedValue = nuevaEducacion.trim();
        if (!cleanedValue) {
            return;
        }

        setForm((prev) => ({ ...prev, educacion: [...prev.educacion, cleanedValue] }));
        setNuevaEducacion('');
    };

    const removeEducacion = (indexToDelete) => {
        setForm((prev) => ({
            ...prev,
            educacion: prev.educacion.filter((_, index) => index !== indexToDelete)
        }));
    };

    const HandlerGuardarPerfil = async () => {
        const session = await getActiveSession();
        if (!session) {
            setFeedback({ type: 'error', message: 'Debes iniciar sesión para guardar el perfil.' });
            return;
        }

        const payload = {
            nombre: form.nombre,
            titular: form.titular,
            ubicacion: form.ubicacion,
            educacion: form.educacion,
            github: form.github || '',
            linkedin: form.linkedin || '',
            avatar: avatarUrl || null,
            banner: bannerUrl || null,
            avatar_offset: avatarOffset,
            banner_offset: bannerOffset,
            banner_zoom: bannerZoom
        };

        const sessionPayload = {
            ...payload,
            banner_zoom: bannerZoom
        };

        try {
            const response = await fetch('http://localhost:3000/api/Cliente/ActualizarPerfil', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await parseApiResponse(response, 'No fue posible guardar el perfil');

            if (data.codigo !== 0) {
                setFeedback({ type: 'error', message: data.mensaje || 'No fue posible guardar el perfil.' });
                return;
            }

            saveSession({
                ...session,
                datosCliente: {
                    ...session.datosCliente,
                    ...sessionPayload
                }
            });

            setFeedback({ type: 'success', message: 'Perfil guardado correctamente.' });

        } catch (error) {
            setFeedback({ type: 'error', message: error.message || 'Error inesperado al guardar el perfil.' });
        }
    };

    return (
        <div className="pt-28 pb-20 px-4 sm:px-6 max-w-7xl mx-auto min-h-screen">
            <div className="glass-card overflow-hidden border-none">
                <ProfileEdit
                    activeSection={activeSection}
                    isDraggingBanner={isDraggingBanner}
                    isDraggingAvatar={isDraggingAvatar}
                    bannerUrl={bannerUrl}
                    bannerOffset={bannerOffset}
                    bannerZoom={bannerZoom}
                    avatarUrl={avatarUrl}
                    avatarOffset={avatarOffset}
                    draggingTarget={draggingTarget}
                    form={form}
                    nuevaEducacion={nuevaEducacion}
                    feedback={feedback}
                    getInitials={getInitials}
                    handleDragOver={handleDragOver}
                    handleDragLeave={handleDragLeave}
                    onDropFile={onDropFile}
                    onSelectFile={onSelectFile}
                    onDragImageStart={onDragImageStart}
                    setBannerZoom={setBannerZoom}
                    setForm={setForm}
                    setNuevaEducacion={setNuevaEducacion}
                    addEducacion={addEducacion}
                    removeEducacion={removeEducacion}
                    HandlerGuardarPerfil={HandlerGuardarPerfil}
                />

                <div className="px-6 sm:px-10 pb-10">
                    <ProfileDashboard
                        isEditMode={isEditMode}
                        isDetailView={isDetailView}
                        activeSection={activeSection}
                        avatarUrl={avatarUrl}
                        avatarOffset={avatarOffset}
                        form={form}
                        getInitials={getInitials}
                        publishedCount={publishedCount}
                        activeServicesCount={activeServicesCount}
                        purchases={purchases}
                        sellerSales={sellerSales}
                        onOpenView={(view) => navigate(`/profile?view=${view}`)}
                    />

                    <ProfileDetailView
                        activeSection={activeSection}
                        isCatalogView={isCatalogView}
                        activeView={activeView}
                        avatarUrl={avatarUrl}
                        avatarOffset={avatarOffset}
                        form={form}
                        getInitials={getInitials}
                        sellerRating={sellerRating}
                        sellerReviews={sellerReviews}
                        catalogItems={catalogItems}
                        misProductos={misProductos}
                        catalogFilter={catalogFilter}
                        isServiceProduct={isServiceProduct}
                        handleEliminarProducto={handleEliminarProducto}
                        misCompras={misCompras}
                        sellerSales={sellerSales}
                        publishedCount={publishedCount}
                        activeServicesCount={activeServicesCount}
                    />
                </div>
            </div>
        </div>
    );
};

export default Profile;
