import { useEffect, useMemo, useState } from 'react';
import { Euro, FileText, ImagePlus, Tag } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSession, refreshSession } from '../services/authClient';
import { normalizeImageUrl } from '../utils/imageUrl';

const parseApiResponse = async (response, defaultMessage) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    await response.text();
    throw new Error(`${defaultMessage}. El servidor devolvió contenido no JSON.`);
  }

  return response.json();
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    tipo: 'producto',
    titulo: '',
    descripcion: '',
    imagen: '',
    archivo: null,
    categoria: '',
    precio: '',
    telefono: '',
    email: '',
    github: '',
    linkedin: ''
  });

  const isProduct = useMemo(() => formData.tipo === 'producto', [formData.tipo]);
  const getActiveSession = async () => (await refreshSession()) || getSession();

  useEffect(() => {
    const loadProduct = async () => {
      const session = await getActiveSession();
      if (!session?.accessToken) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/api/productos/MisProductos', {
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
        const data = await parseApiResponse(response, 'No se pudieron cargar tus productos');

        if (data.codigo !== 0) {
          throw new Error(data.mensaje || 'No se pudieron cargar tus productos');
        }

        const product = (data.productos || []).find((p) => String(p.id) === String(id));

        if (!product) {
          setFeedback({ type: 'error', message: 'No puedes editar este producto o ya no existe.' });
          return;
        }

        setFormData({
          tipo: product.tipo || 'producto',
          titulo: product.titulo || '',
          descripcion: product.descripcion || '',
          imagen: product.imagen || '',
          archivo: product.archivo || null,
          categoria: product.categoria || '',
          precio: product.precio ?? '',
          telefono: product.telefono || '',
          email: product.email || '',
          github: product.github || '',
          linkedin: product.linkedin || ''
        });
      } catch (error) {
        setFeedback({ type: 'error', message: error.message || 'Error cargando el producto.' });
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id, navigate]);

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    setFormData((prev) => ({
      ...prev,
      tipo: nextType,
      archivo: null,
      categoria: nextType === 'producto' ? prev.categoria : '',
      precio: nextType === 'producto' ? prev.precio : '',
      telefono: nextType === 'servicio' ? prev.telefono : '',
      email: nextType === 'servicio' ? prev.email : '',
      github: nextType === 'servicio' ? prev.github : '',
      linkedin: nextType === 'servicio' ? prev.linkedin : ''
    }));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, archivo: file }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    const session = await getActiveSession();
    if (!session?.accessToken) {
      setFeedback({ type: 'error', message: 'Debes iniciar sesión para editar productos.' });
      setIsSubmitting(false);
      return;
    }

    const payload = {
      id,
      tipo: formData.tipo,
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      imagen: normalizeImageUrl(formData.imagen),
      categoria: formData.tipo === 'producto' ? formData.categoria.trim() : null,
      precio: formData.precio === '' ? null : Number(formData.precio),
      archivo: formData.tipo === 'producto' && formData.archivo
        ? {
            nombre: formData.archivo.name,
            tipo: formData.archivo.type,
            tamano: formData.archivo.size
          }
        : null,
      telefono: formData.tipo === 'servicio' ? formData.telefono.trim() : null,
      email: formData.tipo === 'servicio' ? formData.email.trim() : null,
      github: formData.tipo === 'servicio' ? (formData.github.trim() || null) : null,
      linkedin: formData.tipo === 'servicio' ? (formData.linkedin.trim() || null) : null
    };

    try {
      const response = await fetch('http://localhost:3000/api/productos/ActualizarProducto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await parseApiResponse(response, 'No se pudo actualizar el producto');

      if (data.codigo !== 0) {
        throw new Error(data.mensaje || 'No se pudo actualizar el producto.');
      }

      setFeedback({ type: 'success', message: 'Publicación actualizada correctamente.' });
      navigate('/profile?tab=productos');
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Error inesperado al actualizar.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className="pt-28 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto glass-card p-8 text-center text-dimmed">Cargando publicación...</div>
      </section>
    );
  }

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto glass-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-base-primary">Editar publicación</h1>
          <Link to="/profile?tab=productos" className="btn-secondary text-sm">Volver</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="tipo" className="mb-2 block text-sm text-dimmed">Tipo</label>
              <select id="tipo" name="tipo" value={formData.tipo} onChange={handleTypeChange} className="input-field">
                <option value="producto">Producto</option>
                <option value="servicio">Servicio</option>
              </select>
            </div>

            <div>
              <label htmlFor="titulo" className="mb-2 block text-sm text-dimmed">Titulo</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                <input id="titulo" name="titulo" required value={formData.titulo} onChange={handleInputChange} className="input-field pl-10" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="descripcion" className="mb-2 block text-sm text-dimmed">Descripcion</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-4 h-4 text-faint" />
                <textarea id="descripcion" name="descripcion" required value={formData.descripcion} onChange={handleInputChange} className="input-field pl-10 min-h-32" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="imagen" className="mb-2 block text-sm text-dimmed">Imagen (URL)</label>
              <div className="relative">
                <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                <input id="imagen" name="imagen" type="text" required value={formData.imagen} onChange={handleInputChange} className="input-field pl-10" placeholder="https://..." />
              </div>
            </div>

            {isProduct ? (
              <>
                <div>
                  <label htmlFor="categoria" className="mb-2 block text-sm text-dimmed">Categoria</label>
                  <input id="categoria" name="categoria" value={formData.categoria} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="precio" className="mb-2 block text-sm text-dimmed">Precio</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input id="precio" name="precio" type="number" min="0" step="0.01" value={formData.precio} onChange={handleInputChange} className="input-field pl-10" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="archivo" className="mb-2 block text-sm text-dimmed">Archivo (opcional)</label>
                  <input id="archivo" name="archivo" type="file" onChange={handleFileChange} className="input-field" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="precio" className="mb-2 block text-sm text-dimmed">Precio del servicio</label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-faint" />
                    <input id="precio" name="precio" type="number" min="0" step="0.01" value={formData.precio} onChange={handleInputChange} className="input-field pl-10" />
                  </div>
                </div>
                <div>
                  <label htmlFor="telefono" className="mb-2 block text-sm text-dimmed">Telefono</label>
                  <input id="telefono" name="telefono" value={formData.telefono} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm text-dimmed">Email</label>
                  <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="github" className="mb-2 block text-sm text-dimmed">GitHub</label>
                  <input id="github" name="github" value={formData.github} onChange={handleInputChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="linkedin" className="mb-2 block text-sm text-dimmed">LinkedIn</label>
                  <input id="linkedin" name="linkedin" value={formData.linkedin} onChange={handleInputChange} className="input-field" />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <Link to="/profile?tab=productos" className="btn-secondary">Cancelar</Link>
          </div>

          {feedback.message && (
            <p className={`text-sm ${feedback.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
              {feedback.message}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default EditProduct;
