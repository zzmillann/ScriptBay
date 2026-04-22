import { useMemo, useState } from 'react';
import { Euro, FileText, ImagePlus, Tag } from 'lucide-react';
import { clearSession, getSession, refreshSession } from '../services/authClient.js';
import { normalizeImageUrl } from '../utils/imageUrl.js';

const parseApiResponse = async (response, defaultMessage) => {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    await response.text();
    throw new Error(`${defaultMessage}. El servidor devolvió contenido no JSON.`);
  }

  return response.json();
};

const initialForm = {
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
};

const CreateProduct = () => {
  const [formData, setFormData] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const isProduct = useMemo(() => formData.tipo === 'producto', [formData.tipo]);
  const accentInteractiveClass = isProduct
    ? 'focus:border-violet-500 focus:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
    : 'focus:border-blue-500 focus:shadow-[0_0_15px_rgba(59,130,246,0.3)]';
  const sectionInteractiveClass = isProduct
    ? 'hover:border-violet-400/30 hover:bg-violet-50 dark:hover:border-violet-500/20 dark:hover:bg-violet-500/5 dark:hover:shadow-[0_12px_30px_-24px_rgba(168,85,247,0.35)]'
    : 'hover:border-blue-400/30 hover:bg-blue-50 dark:hover:border-blue-500/20 dark:hover:bg-blue-500/5 dark:hover:shadow-[0_12px_30px_-24px_rgba(59,130,246,0.35)]';
  const dynamicIconClass = isProduct ? 'text-violet-400 dark:text-violet-300/65' : 'text-blue-400 dark:text-blue-300/65';
  const dynamicButtonGlowClass = isProduct
    ? 'hover:shadow-[0_14px_30px_-16px_rgba(239,68,68,0.42),0_0_14px_rgba(168,85,247,0.16)]'
    : 'hover:shadow-[0_14px_30px_-16px_rgba(239,68,68,0.42),0_0_14px_rgba(59,130,246,0.16)]';
  const ambientGlowStyle = isProduct
    ? { background: 'rgba(168,85,247,0.22)', left: '-5%', top: '-5%' }
    : { background: 'rgba(59,130,246,0.30)', left: 'calc(100% - 560px)', top: 'calc(100% - 560px)' };
  const sectionClass =
    'space-y-5 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 sm:p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_10px_26px_rgba(0,0,0,0.26)] transition-all duration-300';
  const labelClass = 'mb-2 block text-sm font-medium text-zinc-600 dark:text-white/75';
  const inputBase =
    `w-full rounded-xl border border-zinc-300 dark:border-gray-700 bg-zinc-50 dark:bg-black/40 px-4 py-3 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-white/35 outline-none transition-all duration-300 hover:border-zinc-400 dark:hover:border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:shadow-none ${accentInteractiveClass}`;
  const inputWithIcon = `${inputBase} pl-10`;
  const inputWithIconRight = `${inputBase} pr-10`;
  const iconClass = `pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-white/45 ${dynamicIconClass}`;
  const iconRightClass = `pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 dark:text-white/45 ${dynamicIconClass}`;

  const handleTypeChange = (event) => {
    const nextType = event.target.value;

    setFormData((prev) => ({
      ...prev,
      tipo: nextType,
      archivo: null,
      categoria: '',
      precio: '',
      telefono: '',
      email: '',
      github: '',
      linkedin: ''
    }));

    setFeedback({ type: '', message: '' });
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

    const payload = {
      tipo: formData.tipo,
      titulo: formData.titulo.trim(),
      descripcion: formData.descripcion.trim(),
      imagen: normalizeImageUrl(formData.imagen)
    };

    if (formData.tipo === 'producto') {
      payload.archivo = formData.archivo
        ? {
            nombre: formData.archivo.name,
            tipo: formData.archivo.type,
            tamano: formData.archivo.size
          }
        : null;
      payload.categoria = formData.categoria.trim();
    } else {
      payload.telefono = formData.telefono.trim();
      payload.email = formData.email.trim();
      payload.github = formData.github.trim() || null;
      payload.linkedin = formData.linkedin.trim() || null;
    }

    payload.precio = formData.precio === '' ? null : Number(formData.precio);

    try {
      const session = (await refreshSession()) || getSession();
      const accessToken = session?.accessToken;

      if (!accessToken) {
        throw new Error('Tu sesion ha expirado. Inicia sesion de nuevo para publicar.');
      }

      const response = await fetch('http://localhost:3000/api/productos/GuardarProducto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('No se pudo enviar el formulario.');
      }

      const data = await parseApiResponse(response, 'No se pudo guardar el producto');

      if (data.codigo !== 0) {
        const rawMessage = String(data.mensaje || '');
        if (/invalid\s+jwt|token\s+is\s+expired|jwt/i.test(rawMessage)) {
          clearSession();
          throw new Error('Tu sesion ha expirado. Inicia sesion de nuevo para publicar.');
        }
        throw new Error(data.mensaje || 'No se pudo guardar el producto.');
      }

      setFeedback({
        type: 'success',
        message: `${formData.tipo === 'producto' ? 'Producto' : 'Servicio'} enviado correctamente.`
      });

      setFormData((prev) => ({
        ...initialForm,
        tipo: prev.tipo
      }));
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Ocurrio un error inesperado.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="pt-28 pb-20 px-4 sm:px-6">
      <div className="relative max-w-6xl mx-auto">
        <div
          className={`pointer-events-none absolute rounded-full blur-3xl z-0 transition-all duration-700 ease-in-out ${isProduct ? 'h-[440px] w-[440px]' : 'h-[640px] w-[640px]'}`}
          style={ambientGlowStyle}
        />
        <div className="relative z-10 overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-gradient-to-br dark:from-black dark:via-[#1a0b0b] dark:to-[#1a0f1f] p-7 sm:p-9 shadow-[0_8px_40px_-8px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_40px_rgba(255,0,80,0.15)] backdrop-blur-xl">
        <span className="pointer-events-none absolute left-8 right-8 top-0 h-px bg-linear-to-r from-transparent via-red-400/40 to-transparent"></span>
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-base-primary">Crear publicación</h1>
          <p className="mt-3 text-dimmed max-w-2xl mx-auto">
            Completa el formulario para publicar un producto o un servicio dentro de ScriptBay.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="space-y-6 lg:col-span-3">
              <div className={`${sectionClass} ${sectionInteractiveClass}`}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Información básica</h2>
                <div>
                  <label htmlFor="tipo" className={labelClass}>
                    Tipo
                  </label>
                  <select id="tipo" name="tipo" value={formData.tipo} onChange={handleTypeChange} className={inputBase}>
                    <option value="producto">
                      Producto
                    </option>
                    <option value="servicio">
                      Servicio
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="titulo" className={labelClass}>
                    Título
                  </label>
                  <div className="relative">
                    <Tag className={iconClass} />
                    <input
                      id="titulo"
                      name="titulo"
                      type="text"
                      required
                      value={formData.titulo}
                      onChange={handleInputChange}
                      className={inputWithIcon}
                      placeholder="Ej: Script de automatización para e-commerce"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="descripcion" className={labelClass}>
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    required
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className={`${inputBase} min-h-40 resize-y`}
                    placeholder="Describe qué ofreces y para quién está pensado"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-2">
              <div className={`${sectionClass} ${sectionInteractiveClass}`}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Contenido</h2>
                <div>
                  <label htmlFor="imagen" className={labelClass}>
                    Imagen (URL)
                  </label>
                  <div className="relative">
                    <ImagePlus className={iconClass} />
                    <input
                      id="imagen"
                      name="imagen"
                      type="url"
                      required
                      value={formData.imagen}
                      onChange={handleInputChange}
                      className={inputWithIcon}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {isProduct && (
                  <div>
                    <label htmlFor="archivo" className={labelClass}>
                      Archivo
                    </label>
                    <input
                      id="archivo"
                      name="archivo"
                      type="file"
                      onChange={handleFileChange}
                      className={`${inputBase} file:mr-3 file:rounded-lg file:border file:border-zinc-300 dark:file:border-white/15 file:bg-zinc-100 dark:file:bg-[#151515] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-zinc-700 dark:file:text-white/85 hover:file:border-zinc-400 dark:hover:file:border-white/25 hover:file:bg-zinc-200 dark:hover:file:bg-[#1b1b1b]`}
                    />
                  </div>
                )}
              </div>

              {isProduct ? (
                <div className={`${sectionClass} ${sectionInteractiveClass}`}>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Venta</h2>
                  <div>
                    <label htmlFor="categoria" className={labelClass}>
                      Categoría
                    </label>
                    <input
                      id="categoria"
                      name="categoria"
                      type="text"
                      required={isProduct}
                      value={formData.categoria}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="Ej: Automatización, IA, Integraciones"
                    />
                  </div>

                  <div>
                    <label htmlFor="precio" className={labelClass}>
                      Precio
                    </label>
                    <div className="relative">
                      <Euro className={iconRightClass} />
                      <input
                        id="precio"
                        name="precio"
                        type="number"
                        min="0"
                        step="0.01"
                        required={isProduct}
                        value={formData.precio}
                        onChange={handleInputChange}
                        className={inputWithIconRight}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`${sectionClass} ${sectionInteractiveClass}`}>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-subtle">Contacto</h2>
                  <div>
                    <label htmlFor="precio" className={labelClass}>
                      Precio del servicio
                    </label>
                    <div className="relative">
                      <Euro className={iconRightClass} />
                      <input
                        id="precio"
                        name="precio"
                        type="number"
                        min="0"
                        step="0.01"
                        required={!isProduct}
                        value={formData.precio}
                        onChange={handleInputChange}
                        className={inputWithIconRight}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telefono" className={labelClass}>
                      Teléfono
                    </label>
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      required={!isProduct}
                      value={formData.telefono}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required={!isProduct}
                      value={formData.email}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="github" className={labelClass}>
                      Github (opcional)
                    </label>
                    <input
                      id="github"
                      name="github"
                      type="url"
                      value={formData.github}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="https://github.com/tu-usuario"
                    />
                  </div>

                  <div>
                    <label htmlFor="linkedin" className={labelClass}>
                      LinkedIn (opcional)
                    </label>
                    <input
                      id="linkedin"
                      name="linkedin"
                      type="url"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className={inputBase}
                      placeholder="https://linkedin.com/in/tu-perfil"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {feedback.message && (
            <p
              className={`rounded-xl px-4 py-3 text-sm ${
                feedback.type === 'success'
                  ? 'bg-green-100 dark:bg-green-500/10 border border-green-300 dark:border-green-500/40 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-500/10 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300'
              }`}
            >
              {feedback.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`group relative isolate w-full overflow-hidden rounded-2xl border border-red-400/45 bg-gradient-to-r from-red-600/85 via-red-500/80 to-[#2b0f12]/80 px-6 py-3.5 text-base font-semibold text-white shadow-[0_10px_22px_-14px_rgba(239,68,68,0.38)] transition-all duration-300 hover:scale-[1.03] ${dynamicButtonGlowClass} disabled:opacity-60 disabled:hover:scale-100`}
          >
            <span className="pointer-events-none absolute inset-y-0 -left-[22%] w-[42%] -skew-x-12 bg-linear-to-r from-transparent via-white/30 to-transparent transition-all duration-500 group-hover:left-[118%]"></span>
            <span className="relative inline-flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {isSubmitting ? 'Enviando...' : `Publicar ${isProduct ? 'producto' : 'servicio'}`}
            </span>
          </button>
        </form>
        </div>
      </div>
    </section>
  );
};

export default CreateProduct;
