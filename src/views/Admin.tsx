import React, { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import Toast, { type ToastMessage, type ToastVariant } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import UsageTooltip from '../components/admin/UsageTooltip';
import type {
  AdminCategory,
  AdminContactInfo,
  AdminCostume,
  AdminCostumeImage,
  AdminDesigner,
  AdminNamedOption,
  AdminSiteAsset,
  AdminSiteStats,
  AdminWorkingHour,
  CostumeSize,
} from '../types';
import {
  countRentalHistoryForCostume,
  createAccessory,
  createCostume,
  createFabric,
  deleteAccessory,
  deleteCostume,
  deleteCostumeImage,
  deleteFabric,
  fetchAccessoryUsage,
  fetchAdminCostumes,
  fetchAdminLookups,
  fetchCostumeRelations,
  fetchCostumeImages,
  fetchFabricUsage,
  fetchRelationLookups,
  fetchSiteConfig,
  getAdminImageUrl,
  getSiteAssetUrl,
  reorderCostumeImages,
  saveCostumeRelations,
  saveContactInfo,
  saveSiteStats,
  saveWorkingHours,
  setPrimaryCostumeImage,
  toggleCostumeFlag,
  updateAccessory,
  uploadSiteAsset,
  updateCostume,
  updateCostumeImageAltText,
  updateFabric,
  uploadCostumeImage,
} from '../services/adminService';
import { formatCOP, formatCOPInput, parseCOPInput } from '../utils/format';
import type { AiCostumeDraft } from '../services/aiCostumeService';
import {
  BarChart3,
  Camera,
  Images,
  LayoutDashboard,
  LogOut,
  Palette,
  Settings,
  Shirt,
  Star,
  Trash2,
} from 'lucide-react';

const InsightsSection = lazy(() => import('./admin/InsightsSection'));
const ResumenSection = lazy(() => import('./admin/ResumenSection'));
const CrearDesdeFoto = lazy(() => import('./admin/CrearDesdeFoto'));
const InstagramSection = lazy(() => import('./admin/instagram/InstagramSection'));

type AdminSection = 'resumen' | 'disfraces' | 'insights' | 'instagram' | 'telas-accesorios' | 'configuracion';

const ADMIN_SECTIONS: Array<{ id: AdminSection; label: string; icon: typeof Shirt }> = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'disfraces', label: 'Disfraces', icon: Shirt },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'instagram', label: 'Instagram', icon: Images },
  { id: 'telas-accesorios', label: 'Telas y accesorios', icon: Palette },
  { id: 'configuracion', label: 'Configuración del sitio', icon: Settings },
];

/** Borrador que deja el flujo "Nuevo disfraz desde foto" mientras se revisa el formulario. */
type AiDraftState = {
  photo: File;
  altText: string;
  newFabrics: string[];
  newAccessories: string[];
  notes: string;
  /** Campos que llenó la IA, para resaltarlos. */
  aiFields: string[];
  /** Si el disfraz ya se creó pero faltó guardar la ficha técnica o la foto. */
  pendingForCostumeId: string | null;
};

const normalizeName = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

type ConfirmState = {
  message: string;
  onConfirm: () => void;
  title?: string;
  confirmLabel?: string;
  destructive?: boolean;
  details?: string[];
  detailsTitle?: string;
  confirmText?: string;
  secondaryAction?: { label: string; description?: string; onClick: () => void };
};

type AdminCheckState = 'checking' | 'granted' | 'denied' | 'missing-config';

type UploadQueueItem = {
  id: string;
  name: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
};

const UPLOAD_CONCURRENCY = 3;

type CostumeFormState = {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  designer_id: string;
  rental_price: string;
  sale_price: string;
  deposit_price: string;
  is_available: boolean;
  featured: boolean;
};

const EMPTY_FORM: CostumeFormState = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  designer_id: '',
  rental_price: '',
  sale_price: '',
  deposit_price: '',
  is_available: true,
  featured: false,
};

const SIZE_OPTIONS: CostumeSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '4', '6', '8', '10', '12', '14', '16'];

const EMPTY_SITE_STATS: AdminSiteStats = {
  years_of_tradition: '',
  carnivals_lived: '',
  costumes_rented: '',
  happy_hearts: '',
};

const EMPTY_CONTACT: AdminContactInfo = {
  address: '',
  city: '',
  phone: '',
  whatsapp: '',
  email: '',
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function Admin() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminState, setAdminState] = useState<AdminCheckState>('checking');
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [designers, setDesigners] = useState<AdminDesigner[]>([]);
  const [costumes, setCostumes] = useState<AdminCostume[]>([]);
  const [selectedCostumeId, setSelectedCostumeId] = useState('');
  const [form, setForm] = useState<CostumeFormState>(EMPTY_FORM);
  const [isSavingCostume, setIsSavingCostume] = useState(false);
  const [isLoadingPanelData, setIsLoadingPanelData] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>('resumen');
  const [showPhotoWizard, setShowPhotoWizard] = useState(false);
  const [instagramTab, setInstagramTab] = useState<'calendario' | 'campanas' | 'reglas' | 'conexion' | undefined>(undefined);
  const validatedAdminIdRef = useRef<string | null>(null);
  const [pendingPrefill, setPendingPrefill] = useState<AiCostumeDraft | null>(null);
  const [aiDraft, setAiDraft] = useState<AiDraftState | null>(null);
  const [isRetryingAiExtras, setIsRetryingAiExtras] = useState(false);
  const aiPhotoUrl = useMemo(() => (aiDraft ? URL.createObjectURL(aiDraft.photo) : ''), [aiDraft?.photo]);
  const [viewMode, setViewMode] = useState<'tabla' | 'lista' | 'galeria'>('lista');
  const disfracesRightColumnRef = useRef<HTMLDivElement | null>(null);
  const [disfracesLeftColumnHeight, setDisfracesLeftColumnHeight] = useState<number | undefined>(undefined);
  const [costumeSearchQuery, setCostumeSearchQuery] = useState('');
  const [fabricSearchQuery, setFabricSearchQuery] = useState('');
  const [accessorySearchQuery, setAccessorySearchQuery] = useState('');
  const [images, setImages] = useState<AdminCostumeImage[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [altSaveStatus, setAltSaveStatus] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({});
  const altDebounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const [fabrics, setFabrics] = useState<AdminNamedOption[]>([]);
  const [accessories, setAccessories] = useState<AdminNamedOption[]>([]);
  const [fabricUsage, setFabricUsage] = useState<Map<string, string[]>>(new Map());
  const [accessoryUsage, setAccessoryUsage] = useState<Map<string, string[]>>(new Map());
  const [detailsText, setDetailsText] = useState('');
  const [selectedFabricIds, setSelectedFabricIds] = useState<string[]>([]);
  const [selectedAccessoryIds, setSelectedAccessoryIds] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<CostumeSize[]>([]);
  const [newFabricName, setNewFabricName] = useState('');
  const [newAccessoryName, setNewAccessoryName] = useState('');
  const [isSavingRelations, setIsSavingRelations] = useState(false);
  const [editingFabric, setEditingFabric] = useState<{ id: string; name: string } | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<{ id: string; name: string } | null>(null);
  const [newFabricNameTab, setNewFabricNameTab] = useState('');
  const [newAccessoryNameTab, setNewAccessoryNameTab] = useState('');
  const [siteStats, setSiteStats] = useState<AdminSiteStats>(EMPTY_SITE_STATS);
  const [contactInfo, setContactInfo] = useState<AdminContactInfo>(EMPTY_CONTACT);
  const [workingHours, setWorkingHours] = useState<Array<{ days: string; hours: string }>>([]);
  const [siteAssets, setSiteAssets] = useState<AdminSiteAsset[]>([]);
  const [isSavingSiteConfig, setIsSavingSiteConfig] = useState(false);
  const [newAssetKey, setNewAssetKey] = useState('hero-banner');
  const [isUploadingSiteAsset, setIsUploadingSiteAsset] = useState(false);

  const notify = (text: string, variant: ToastVariant = 'success') => setToast({ text, variant });
  const notifyError = (error: unknown) =>
    setToast({ text: error instanceof Error ? error.message : String(error), variant: 'error' });

  const userEmail = useMemo(() => session?.user?.email ?? '', [session]);

  const requestConfirm = (options: { title: string; message: string; confirmLabel: string; onConfirm: () => void }) =>
    setConfirmState({
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel,
      onConfirm: () => {
        setConfirmState(null);
        options.onConfirm();
      },
    });

  const openInstagram = (tab?: 'calendario' | 'campanas' | 'reglas' | 'conexion') => {
    setInstagramTab(tab);
    setActiveSection('instagram');
  };

  // Regreso del inicio de sesión de Instagram (instagram-oauth-callback → /admin?instagram=...).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get('instagram');
    if (!result) {
      return;
    }
    const detail = params.get('detalle');
    setInstagramTab('conexion');
    setActiveSection('instagram');
    if (result === 'conectado') {
      setToast({ text: 'Cuenta de Instagram conectada.', variant: 'success' });
    } else {
      const reasons: Record<string, string> = {
        cancelado: 'Se canceló el inicio de sesión en Instagram.',
        enlace_vencido: 'El enlace de conexión venció. Intenta conectar de nuevo.',
        sin_permiso: 'Esa sesión no tiene permisos de admin.',
        sin_cuenta:
          'Meta no asignó ninguna cuenta de Instagram a la app. Vuelve a conectar y elige la cuenta de Disfraces Madi; si sigue igual, revisa en el portafolio empresarial que la cuenta esté asignada a la app.',
      };
      setToast({
        text: reasons[detail ?? ''] ?? 'No se pudo conectar Instagram. Intenta de nuevo; si sigue fallando, revisa la configuración de la app en Meta.',
        variant: 'error',
      });
    }
    params.delete('instagram');
    params.delete('detalle');
    const query = params.toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }, []);
  const selectedCostume = useMemo(
    () => costumes.find((item) => item.id === selectedCostumeId) ?? null,
    [costumes, selectedCostumeId]
  );

  const filteredAdminCostumes = useMemo(() => {
    const query = costumeSearchQuery.trim().toLowerCase();
    if (!query) {
      return costumes;
    }
    return costumes.filter((costume) =>
      [costume.name, costume.slug, costume.category_name ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [costumes, costumeSearchQuery]);

  const filteredFabrics = useMemo(() => {
    const query = fabricSearchQuery.trim().toLowerCase();
    if (!query) {
      return fabrics;
    }
    return fabrics.filter((fabric) => fabric.name.toLowerCase().includes(query));
  }, [fabrics, fabricSearchQuery]);

  const filteredAccessories = useMemo(() => {
    const query = accessorySearchQuery.trim().toLowerCase();
    if (!query) {
      return accessories;
    }
    return accessories.filter((accessory) => accessory.name.toLowerCase().includes(query));
  }, [accessories, accessorySearchQuery]);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const {
        data: { session: currentSession },
      } = await supabaseAdmin.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(currentSession);
      if (currentSession?.user?.id) {
        await validateAdmin(currentSession.user.id);
      } else {
        setAdminState('denied');
      }
    };

    bootstrap();

    const {
      data: { subscription },
    } = supabaseAdmin.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) {
        return;
      }

      setSession(newSession);
      if (newSession?.user?.id) {
        await validateAdmin(newSession.user.id);
      } else {
        validatedAdminIdRef.current = null;
        setAdminState('denied');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const validateAdmin = async (userId: string) => {
    // Supabase emite eventos de sesión al refrescar el token o al volver a la pestaña (p. ej. al
    // regresar de la cámara del celular). Si este usuario ya se validó, no se vuelve a pasar por
    // 'checking': eso desmontaba el panel y perdía lo que se estaba haciendo.
    if (validatedAdminIdRef.current === userId) {
      return;
    }
    setAdminState('checking');
    setErrorMessage('');

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      setAdminState('missing-config');
      setErrorMessage(
        'No se pudo validar permisos admin. Aplica primero las migraciones 005-007 de Supabase.'
      );
      return;
    }

    if (data?.user_id) {
      validatedAdminIdRef.current = userId;
      setAdminState('granted');
    } else {
      setAdminState('denied');
      setErrorMessage('Tu usuario no tiene rol admin en esta base de datos.');
    }
  };

  const loadPanelData = async () => {
    setIsLoadingPanelData(true);
    setToast(null);
    try {
      const { categories: loadedCategories, designers: loadedDesigners } =
        await fetchAdminLookups();
      setCategories(loadedCategories);
      setDesigners(loadedDesigners);

      const loadedCostumes = await fetchAdminCostumes();
      setCostumes(loadedCostumes);

      const relationLookups = await fetchRelationLookups();
      setFabrics(relationLookups.fabrics);
      setAccessories(relationLookups.accessories);

      const [loadedFabricUsage, loadedAccessoryUsage] = await Promise.all([
        fetchFabricUsage(),
        fetchAccessoryUsage(),
      ]);
      setFabricUsage(loadedFabricUsage);
      setAccessoryUsage(loadedAccessoryUsage);

      const config = await fetchSiteConfig();
      setSiteStats(config.stats);
      setContactInfo(config.contact);
      setWorkingHours(
        config.workingHours.length > 0
          ? config.workingHours.map((row: AdminWorkingHour) => ({
              days: row.days,
              hours: row.hours,
            }))
          : [{ days: '', hours: '' }]
      );
      setSiteAssets(config.siteAssets);

      if (loadedCostumes.length > 0) {
        hydrateFormFromCostume(loadedCostumes[0]);
      } else {
        setSelectedCostumeId('');
        setForm({
          ...EMPTY_FORM,
          category_id: loadedCategories[0]?.id ?? '',
        });
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setIsLoadingPanelData(false);
    }
  };

  const hydrateFormFromCostume = (costume: AdminCostume) => {
    // Un borrador de "Desde foto" solo sobrevive si es el del disfraz que quedó pendiente de completar.
    setAiDraft((prev) => (prev && prev.pendingForCostumeId === costume.id ? prev : null));
    setSelectedCostumeId(costume.id);
    setForm({
      name: costume.name,
      slug: costume.slug,
      category_id: costume.category_id,
      description: costume.description,
      designer_id: costume.designer_id ?? '',
      rental_price: String(costume.rental_price ?? ''),
      sale_price: costume.sale_price !== null ? String(costume.sale_price) : '',
      deposit_price: costume.deposit_price !== null ? String(costume.deposit_price) : '',
      is_available: costume.is_available,
      featured: costume.featured,
    });
  };

  const handleNavigateToCostumeFromInsights = (costumeId: string) => {
    const target = costumes.find((item) => item.id === costumeId);
    if (target) {
      hydrateFormFromCostume(target);
    } else {
      setSelectedCostumeId(costumeId);
    }
    setActiveSection('disfraces');
  };

  const loadImages = async (costumeId: string) => {
    setIsLoadingImages(true);
    setToast(null);
    setUploadQueue([]);
    try {
      const loadedImages = await fetchCostumeImages(costumeId);
      setImages(loadedImages);
      const initialDrafts: Record<string, string> = {};
      loadedImages.forEach((item) => {
        initialDrafts[item.id] = item.alt_text ?? '';
      });
      setAltDrafts(initialDrafts);
      setAltSaveStatus({});
    } catch (error) {
      notifyError(error);
      setImages([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Mantiene al día la cantidad de fotos del disfraz abierto (marca "1 foto" y campañas de Instagram).
  useEffect(() => {
    const costumeId = images[0]?.costume_id;
    if (isLoadingImages || !costumeId) {
      return;
    }
    setCostumes((prev) =>
      prev.map((costume) =>
        costume.id === costumeId && costume.image_count !== images.length ? { ...costume, image_count: images.length } : costume
      )
    );
  }, [images, isLoadingImages]);

  const loadRelations = async (costumeId: string) => {
    setToast(null);
    try {
      const relations = await fetchCostumeRelations(costumeId);
      setDetailsText(relations.details.map((item) => item.detail).join('\n'));
      setSelectedFabricIds(relations.fabricIds);
      setSelectedAccessoryIds(relations.accessoryIds);
      setSelectedSizes(relations.sizes);
    } catch (error) {
      notifyError(error);
      setDetailsText('');
      setSelectedFabricIds([]);
      setSelectedAccessoryIds([]);
      setSelectedSizes([]);
    }
  };

  useEffect(() => {
    if (adminState === 'granted') {
      loadPanelData();
    }
  }, [adminState]);

  useEffect(() => {
    if (selectedCostumeId) {
      loadImages(selectedCostumeId);
      loadRelations(selectedCostumeId);
    } else {
      setImages([]);
      setDetailsText('');
      setSelectedFabricIds([]);
      setSelectedAccessoryIds([]);
      setSelectedSizes([]);
    }
  }, [selectedCostumeId]);

  useEffect(() => () => {
    if (aiPhotoUrl) URL.revokeObjectURL(aiPhotoUrl);
  }, [aiPhotoUrl]);

  // Aplica el borrador de "Desde foto" al formulario. Va después del efecto anterior para que
  // la limpieza de relaciones al pasar a "nuevo disfraz" no borre lo que sugirió la IA.
  useEffect(() => {
    if (!pendingPrefill || selectedCostumeId) {
      return;
    }
    const draft = pendingPrefill;
    const extracted = draft.extracted;
    const aiFields: string[] = [];
    const findId = <T extends { id: string; name: string }>(items: T[], name: string) =>
      name ? items.find((item) => normalizeName(item.name) === normalizeName(name))?.id ?? '' : '';
    const digits = (value: number | null) => (value !== null && value > 0 ? String(Math.round(value)) : '');

    const categoryId = extracted ? findId(categories, extracted.categoria) : '';
    const designerId = extracted ? findId(designers, extracted.disenadora) : '';
    const nextForm: CostumeFormState = {
      ...EMPTY_FORM,
      category_id: categoryId || (categories[0]?.id ?? ''),
    };
    if (extracted) {
      if (extracted.nombre) {
        nextForm.name = extracted.nombre;
        nextForm.slug = slugify(extracted.nombre);
        aiFields.push('name');
      }
      if (categoryId) aiFields.push('category_id');
      if (designerId) {
        nextForm.designer_id = designerId;
        aiFields.push('designer_id');
      }
      if (extracted.descripcion) {
        nextForm.description = extracted.descripcion;
        aiFields.push('description');
      }
      nextForm.rental_price = digits(extracted.precio_alquiler);
      nextForm.sale_price = digits(extracted.precio_venta);
      nextForm.deposit_price = digits(extracted.precio_deposito);
      if (nextForm.rental_price) aiFields.push('rental_price');
      if (nextForm.sale_price) aiFields.push('sale_price');
      if (nextForm.deposit_price) aiFields.push('deposit_price');
    }
    setForm(nextForm);

    const fabricIds = extracted
      ? extracted.telas_existentes.map((name) => findId(fabrics, name)).filter(Boolean)
      : [];
    const accessoryIds = extracted
      ? extracted.accesorios_existentes.map((name) => findId(accessories, name)).filter(Boolean)
      : [];
    const sizes = extracted
      ? (extracted.tallas.filter((size) => SIZE_OPTIONS.includes(size as CostumeSize)) as CostumeSize[])
      : [];
    setDetailsText(extracted ? extracted.detalles_visibles.join('\n') : '');
    setSelectedFabricIds(fabricIds);
    setSelectedAccessoryIds(accessoryIds);
    setSelectedSizes(sizes);
    if (extracted?.detalles_visibles.length) aiFields.push('details');
    if (fabricIds.length) aiFields.push('fabrics');
    if (accessoryIds.length) aiFields.push('accessories');
    if (sizes.length) aiFields.push('sizes');

    setAiDraft({
      photo: draft.photo,
      altText: draft.altText,
      newFabrics: extracted?.telas_nuevas ?? [],
      newAccessories: extracted?.accesorios_nuevos ?? [],
      notes: extracted?.notas_adicionales ?? '',
      aiFields,
      pendingForCostumeId: null,
    });
    setPendingPrefill(null);
    // En el celular el formulario queda debajo de la lista: llevar la vista al borrador.
    setTimeout(() => {
      document.getElementById('borrador-ia')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    notify(
      extracted
        ? 'Revisa los datos que sugirió la IA (resaltados) y guarda el disfraz.'
        : 'Foto lista. Completa el formulario y guarda el disfraz.',
      'info'
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrefill, selectedCostumeId]);

  useLayoutEffect(() => {
    if (activeSection !== 'disfraces') {
      return;
    }

    const node = disfracesRightColumnRef.current;
    if (!node) {
      return;
    }

    const updateHeight = () => {
      setDisfracesLeftColumnHeight(
        window.innerWidth >= 1280 ? node.getBoundingClientRect().height : undefined
      );
    };

    // Medicion inmediata (cubre el cambio que disparo este efecto) + un
    // ResizeObserver como respaldo para crecimiento asincrono que no está
    // atado a ninguno de los deps de abajo (ej. imagenes de la galeria
    // terminando de cargar).
    updateHeight();
    window.addEventListener('resize', updateHeight);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', updateHeight);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [
    activeSection,
    selectedCostumeId,
    images.length,
    uploadQueue.length,
    fabrics.length,
    accessories.length,
    selectedFabricIds.length,
    selectedAccessoryIds.length,
  ]);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const { error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
    }

    setIsSubmitting(false);
  };

  const handleSignOut = async () => {
    validatedAdminIdRef.current = null;
    await supabaseAdmin.auth.signOut();
    setSession(null);
    setAdminState('denied');
  };

  const handleCreateNew = () => {
    setAiDraft(null);
    setSelectedCostumeId('');
    setImages([]);
    setAltDrafts({});
    setForm({
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? '',
    });
    setDetailsText('');
    setSelectedFabricIds([]);
    setSelectedAccessoryIds([]);
    setSelectedSizes([]);
    notify('Creando nuevo disfraz. Completa el formulario y guarda.', 'info');
  };

  const toggleSelection = (
    values: string[],
    value: string,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const toggleSize = (size: CostumeSize) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((item) => item !== size) : [...prev, size]
    );
  };

  const aiRing = (field: string) =>
    aiDraft && !aiDraft.pendingForCostumeId && aiDraft.aiFields.includes(field) ? ' ring-2 ring-[#FDC003]' : '';

  const handleOpenPhotoWizard = () => {
    setShowPhotoWizard(true);
  };

  const handleAiDraftComplete = (draft: AiCostumeDraft) => {
    setShowPhotoWizard(false);
    setActiveSection('disfraces');
    setSelectedCostumeId('');
    setImages([]);
    setAltDrafts({});
    setUploadQueue([]);
    setPendingPrefill(draft);
  };

  const handleDiscardAiDraft = () => {
    setAiDraft(null);
  };

  const handleCreateSuggested = async (kind: 'fabric' | 'accessory', name: string) => {
    setToast(null);
    try {
      if (kind === 'fabric') {
        const created = await createFabric(name);
        setFabrics((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedFabricIds((prev) => [...prev, created.id]);
      } else {
        const created = await createAccessory(name);
        setAccessories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedAccessoryIds((prev) => [...prev, created.id]);
      }
      setAiDraft((prev) =>
        prev
          ? {
              ...prev,
              newFabrics: kind === 'fabric' ? prev.newFabrics.filter((item) => item !== name) : prev.newFabrics,
              newAccessories:
                kind === 'accessory' ? prev.newAccessories.filter((item) => item !== name) : prev.newAccessories,
            }
          : prev
      );
      notify(`“${name}” creado y marcado en la ficha técnica.`);
    } catch (error) {
      notifyError(error);
    }
  };

  const handleDismissSuggested = (kind: 'fabric' | 'accessory', name: string) => {
    setAiDraft((prev) =>
      prev
        ? {
            ...prev,
            newFabrics: kind === 'fabric' ? prev.newFabrics.filter((item) => item !== name) : prev.newFabrics,
            newAccessories:
              kind === 'accessory' ? prev.newAccessories.filter((item) => item !== name) : prev.newAccessories,
          }
        : prev
    );
  };

  /**
   * Guarda lo que el flujo "Desde foto" agrega a un disfraz recién creado: ficha técnica y foto principal.
   * Devuelve la lista de lo que no se pudo guardar.
   */
  const persistAiExtras = async (
    costumeId: string,
    draft: AiDraftState,
    relations: { details: string[]; fabricIds: string[]; accessoryIds: string[]; sizes: CostumeSize[] }
  ) => {
    const failed: string[] = [];
    try {
      await saveCostumeRelations(costumeId, relations);
    } catch (error) {
      console.error('[desde foto] no se pudo guardar la ficha técnica', error);
      failed.push('la ficha técnica');
    }
    try {
      await uploadCostumeImage(costumeId, draft.photo, { makePrimary: true, altText: draft.altText });
    } catch (error) {
      console.error('[desde foto] no se pudo subir la foto', error);
      failed.push('la foto principal');
    }
    return failed;
  };

  const currentRelations = () => ({
    details: detailsText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean),
    fabricIds: selectedFabricIds,
    accessoryIds: selectedAccessoryIds,
    sizes: selectedSizes,
  });

  const handleRetryAiExtras = async () => {
    if (!aiDraft?.pendingForCostumeId) return;
    const costumeId = aiDraft.pendingForCostumeId;
    setIsRetryingAiExtras(true);
    setToast(null);
    const failed = await persistAiExtras(costumeId, aiDraft, currentRelations());
    await Promise.all([loadRelations(costumeId), loadImages(costumeId)]);
    setIsRetryingAiExtras(false);
    if (failed.length) {
      notify(`Todavía no se pudo guardar ${failed.join(' ni ')}. Intenta de nuevo en un momento.`, 'error');
    } else {
      setAiDraft(null);
      notify('Listo, el disfraz quedó completo con su foto principal.');
    }
  };

  const handleCreateFabric = async () => {
    setToast(null);
    try {
      const created = await createFabric(newFabricName);
      setFabrics((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedFabricIds((prev) => [...prev, created.id]);
      setNewFabricName('');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleCreateAccessory = async () => {
    setToast(null);
    try {
      const created = await createAccessory(newAccessoryName);
      setAccessories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedAccessoryIds((prev) => [...prev, created.id]);
      setNewAccessoryName('');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleCreateFabricTab = async () => {
    setToast(null);
    try {
      const created = await createFabric(newFabricNameTab);
      setFabrics((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFabricNameTab('');
      notify('Tela creada.');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleCreateAccessoryTab = async () => {
    setToast(null);
    try {
      const created = await createAccessory(newAccessoryNameTab);
      setAccessories((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewAccessoryNameTab('');
      notify('Accesorio creado.');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleUpdateFabric = async (id: string, name: string) => {
    setToast(null);
    try {
      const updated = await updateFabric(id, name);
      setFabrics((prev) =>
        prev.map((item) => (item.id === id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingFabric(null);
      notify('Tela actualizada.');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleDeleteFabric = (id: string, name: string) => {
    setConfirmState({
      message: `Eliminar la tela "${name}"? Esta accion no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmState(null);
        setToast(null);
        try {
          await deleteFabric(id);
          setFabrics((prev) => prev.filter((item) => item.id !== id));
          setSelectedFabricIds((prev) => prev.filter((item) => item !== id));
          notify('Tela eliminada.');
        } catch (error) {
          notifyError(error);
        }
      },
    });
  };

  const handleUpdateAccessory = async (id: string, name: string) => {
    setToast(null);
    try {
      const updated = await updateAccessory(id, name);
      setAccessories((prev) =>
        prev.map((item) => (item.id === id ? updated : item)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingAccessory(null);
      notify('Accesorio actualizado.');
    } catch (error) {
      notifyError(error);
    }
  };

  const handleDeleteAccessory = (id: string, name: string) => {
    setConfirmState({
      message: `Eliminar el accesorio "${name}"? Esta accion no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmState(null);
        setToast(null);
        try {
          await deleteAccessory(id);
          setAccessories((prev) => prev.filter((item) => item.id !== id));
          setSelectedAccessoryIds((prev) => prev.filter((item) => item !== id));
          notify('Accesorio eliminado.');
        } catch (error) {
          notifyError(error);
        }
      },
    });
  };

  const handleSaveRelations = async () => {
    if (!selectedCostumeId) {
      notify('Primero guarda el disfraz para editar sus relaciones.', 'error');
      return;
    }

    setIsSavingRelations(true);
    setToast(null);
    try {
      await saveCostumeRelations(selectedCostumeId, {
        details: detailsText
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        fabricIds: selectedFabricIds,
        accessoryIds: selectedAccessoryIds,
        sizes: selectedSizes,
      });
      await loadRelations(selectedCostumeId);
      notify('Detalles, telas, accesorios y tallas actualizados.');
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSavingRelations(false);
    }
  };

  const handleSaveSiteConfig = async () => {
    setIsSavingSiteConfig(true);
    setToast(null);
    try {
      await Promise.all([
        saveSiteStats(siteStats),
        saveContactInfo(contactInfo),
        saveWorkingHours(workingHours),
      ]);

      const config = await fetchSiteConfig();
      setSiteAssets(config.siteAssets);
      notify('Configuracion del sitio actualizada.');
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSavingSiteConfig(false);
    }
  };

  const handleWorkingHourField = (
    index: number,
    field: 'days' | 'hours',
    value: string
  ) => {
    setWorkingHours((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleAddWorkingHour = () => {
    setWorkingHours((prev) => [...prev, { days: '', hours: '' }]);
  };

  const handleRemoveWorkingHour = (index: number) => {
    setWorkingHours((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadSiteAsset = async (files: FileList | null) => {
    if (!files || files.length === 0 || !newAssetKey.trim()) {
      return;
    }

    const file = files[0];
    setIsUploadingSiteAsset(true);
    setToast(null);
    try {
      await uploadSiteAsset(newAssetKey.trim(), file);
      const config = await fetchSiteConfig();
      setSiteAssets(config.siteAssets);
      notify('Asset institucional actualizado.');
    } catch (error) {
      notifyError(error);
    } finally {
      setIsUploadingSiteAsset(false);
    }
  };

  const handleFormField = (field: keyof CostumeFormState, value: string | boolean) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value } as CostumeFormState;
      if (field === 'name' && !selectedCostumeId) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const handleSaveCostume = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingCostume(true);
    setToast(null);

    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        category_id: form.category_id,
        description: form.description.trim(),
        designer_id: form.designer_id || null,
        rental_price: form.rental_price.trim() ? Number(form.rental_price) : null,
        sale_price: form.sale_price.trim() ? Number(form.sale_price) : null,
        deposit_price: form.deposit_price.trim() ? Number(form.deposit_price) : null,
        is_available: form.is_available,
        featured: form.featured,
      };

      if (!payload.name || !payload.slug || !payload.category_id) {
        throw new Error('Completa nombre, slug y categoria.');
      }

      if (payload.rental_price !== null && Number.isNaN(payload.rental_price)) {
        throw new Error('Debes indicar un valor numerico para precio de alquiler.');
      }

      if (payload.deposit_price !== null && Number.isNaN(payload.deposit_price)) {
        throw new Error('Debes indicar un valor numerico para el deposito.');
      }

      if (selectedCostumeId) {
        await updateCostume(selectedCostumeId, payload);
        notify('Disfraz actualizado correctamente.');
      } else {
        const draft = aiDraft;
        const relations = currentRelations();
        const created = await createCostume(payload);
        setSelectedCostumeId(created.id);
        if (draft) {
          const failed = await persistAiExtras(created.id, draft, relations);
          await Promise.all([loadRelations(created.id), loadImages(created.id)]);
          if (failed.length) {
            setAiDraft({ ...draft, pendingForCostumeId: created.id });
            notify(
              `El disfraz se creó, pero no se pudo guardar ${failed.join(' ni ')}. Usa “Reintentar” en el aviso de arriba.`,
              'error'
            );
          } else {
            setAiDraft(null);
            notify(`Listo, “${payload.name}” quedó creado con su foto principal.`);
          }
        } else {
          notify('Disfraz creado. Ya puedes gestionar su galeria.');
        }
      }

      const refreshed = await fetchAdminCostumes();
      setCostumes(refreshed);
      if (!selectedCostumeId) {
        const createdRef = refreshed.find((item) => item.slug === payload.slug);
        if (createdRef) {
          hydrateFormFromCostume(createdRef);
        }
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setIsSavingCostume(false);
    }
  };

  const handleDeleteCostume = async () => {
    if (!selectedCostumeId) {
      return;
    }

    const costume = selectedCostume;
    const costumeIdToDelete = selectedCostumeId;
    const photoCount = images.length;
    let rentalCount: number | null = null;
    try {
      rentalCount = await countRentalHistoryForCostume(costumeIdToDelete);
    } catch {
      rentalCount = null;
    }

    const rentalDetail =
      rentalCount === null
        ? 'Los alquileres del histórico vinculados a este disfraz quedan sin vincular y salen de los rankings.'
        : rentalCount > 0
          ? `${rentalCount} ${rentalCount === 1 ? 'alquiler del histórico queda' : 'alquileres del histórico quedan'} sin vincular y salen de los rankings.`
          : 'No tiene alquileres vinculados en el histórico.';

    setConfirmState({
      title: costume ? `¿Eliminar “${costume.name}”?` : '¿Eliminar este disfraz?',
      message:
        costume && costume.is_available
          ? 'Si solo quieres que no salga en el sitio, ocúltalo: así no pierdes nada.'
          : 'Este disfraz ya está oculto del catálogo. Eliminarlo borra toda su información.',
      confirmLabel: 'Eliminar para siempre',
      destructive: true,
      detailsTitle: 'Si lo eliminas para siempre:',
      details: [
        `Se ${photoCount === 1 ? 'borra 1 foto' : `borran ${photoCount} fotos`}, sus tallas, detalles, telas y accesorios.`,
        rentalDetail,
        'Si tiene reseñas, quedan publicadas pero sin disfraz asociado.',
        'Se pierden sus visitas y clics a WhatsApp en Insights. No se puede deshacer.',
      ],
      confirmText: costume?.slug,
      secondaryAction:
        costume && costume.is_available
          ? {
              label: 'Ocultar del catálogo',
              description:
                'Deja de verse en el sitio. Conservas fotos, ficha técnica e historial, y lo vuelves a mostrar cuando quieras.',
              onClick: async () => {
                setConfirmState(null);
                const ok = await handleToggleFromList(costume, 'is_available');
                if (ok) {
                  notify(`Listo, “${costume.name}” ya no se ve en el sitio.`);
                }
              },
            }
          : undefined,
      onConfirm: async () => {
        setConfirmState(null);
        setToast(null);
        try {
          await deleteCostume(costumeIdToDelete);
          const refreshed = await fetchAdminCostumes();
          setCostumes(refreshed);
          if (refreshed.length > 0) {
            hydrateFormFromCostume(refreshed[0]);
          } else {
            handleCreateNew();
          }
          notify('Disfraz eliminado.');
        } catch (error) {
          notifyError(error);
        }
      },
    });
  };

  const handleToggleFromList = async (
    costume: AdminCostume,
    field: 'is_available' | 'featured'
  ) => {
    const nextValue = !costume[field];
    setToast(null);
    try {
      await toggleCostumeFlag(costume.id, field, nextValue);
      setCostumes((prev) =>
        prev.map((item) =>
          item.id === costume.id ? { ...item, [field]: nextValue } : item
        )
      );
      if (selectedCostumeId === costume.id) {
        setForm((prev) => ({ ...prev, [field]: nextValue }));
      }
      return true;
    } catch (error) {
      notifyError(error);
      return false;
    }
  };

  const handleUploadImages = async (files: FileList | null) => {
    if (!selectedCostumeId || !files || files.length === 0) {
      return;
    }

    const fileArray = Array.from(files);
    const queue: UploadQueueItem[] = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      status: 'pending',
    }));
    const hadPrimaryAlready = images.length > 0;

    setIsUploadingImages(true);
    setUploadQueue(queue);
    setToast(null);

    const updateQueueItem = (id: string, patch: Partial<UploadQueueItem>) => {
      setUploadQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
    };

    let nextIndex = 0;
    let successCount = 0;
    const failures: string[] = [];

    const worker = async () => {
      while (nextIndex < fileArray.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        const file = fileArray[currentIndex];
        const item = queue[currentIndex];

        updateQueueItem(item.id, { status: 'uploading' });
        try {
          await uploadCostumeImage(selectedCostumeId, file, {
            makePrimary: !hadPrimaryAlready && currentIndex === 0,
            altText: form.name,
          });
          updateQueueItem(item.id, { status: 'done' });
          successCount += 1;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          updateQueueItem(item.id, { status: 'error', error: message });
          failures.push(`${file.name}: ${message}`);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(UPLOAD_CONCURRENCY, fileArray.length) }, () => worker())
    );

    await loadImages(selectedCostumeId);
    setIsUploadingImages(false);

    if (failures.length === 0) {
      notify(`${successCount} de ${fileArray.length} imagenes cargadas correctamente.`);
    } else {
      notify(
        `${successCount} de ${fileArray.length} imagenes cargadas. Fallaron: ${failures.join('; ')}`,
        'error'
      );
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!selectedCostumeId) {
      return;
    }
    setToast(null);
    try {
      await setPrimaryCostumeImage(selectedCostumeId, imageId);
      await loadImages(selectedCostumeId);
    } catch (error) {
      notifyError(error);
    }
  };

  const handleDeleteImage = async (image: AdminCostumeImage) => {
    setToast(null);
    try {
      await deleteCostumeImage(image);
      if (selectedCostumeId) {
        await loadImages(selectedCostumeId);
      }
    } catch (error) {
      notifyError(error);
    }
  };

  const persistAltText = async (image: AdminCostumeImage, value: string) => {
    setAltSaveStatus((prev) => ({ ...prev, [image.id]: 'saving' }));
    try {
      await updateCostumeImageAltText(image.id, value);
      setImages((prev) =>
        prev.map((item) => (item.id === image.id ? { ...item, alt_text: value.trim() || null } : item))
      );
      setAltSaveStatus((prev) => ({ ...prev, [image.id]: 'saved' }));
    } catch (error) {
      setAltSaveStatus((prev) => ({ ...prev, [image.id]: 'error' }));
      notifyError(error);
    }
  };

  const handleAltTextChange = (image: AdminCostumeImage, value: string) => {
    setAltDrafts((prev) => ({ ...prev, [image.id]: value }));
    setAltSaveStatus((prev) => ({ ...prev, [image.id]: 'idle' }));

    if (altDebounceTimers.current[image.id]) {
      clearTimeout(altDebounceTimers.current[image.id]);
    }
    altDebounceTimers.current[image.id] = setTimeout(() => {
      persistAltText(image, value);
    }, 600);
  };

  const handleAltTextBlur = (image: AdminCostumeImage) => {
    if (altDebounceTimers.current[image.id]) {
      clearTimeout(altDebounceTimers.current[image.id]);
      delete altDebounceTimers.current[image.id];
    }
    persistAltText(image, altDrafts[image.id] ?? '');
  };

  const handleMoveImage = async (imageId: string, direction: 'up' | 'down') => {
    if (!selectedCostumeId) {
      return;
    }

    const index = images.findIndex((item) => item.id === imageId);
    if (index < 0) {
      return;
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reordered = [...images];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await reorderCostumeImages(
        selectedCostumeId,
        reordered.map((item) => item.id)
      );
      await loadImages(selectedCostumeId);
    } catch (error) {
      notifyError(error);
    }
  };

  if (!session) {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="rounded-2xl border border-[#1A1418]/10 bg-white p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-[#1A1418]">Acceso administrativo</h1>
          <p className="mt-2 text-sm text-[#5C5257]">
            Inicia sesion para gestionar catalogo e imagenes del Atelier.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block text-sm text-[#1A1418]" htmlFor="admin-email">
              Correo
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-[#1A1418] outline-none focus:border-[#A8001A]"
            />

            <label className="block text-sm text-[#1A1418]" htmlFor="admin-password">
              Contrasena
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-[#1A1418] outline-none focus:border-[#A8001A]"
            />

            {errorMessage ? <p className="text-sm text-[#A8001A]">{errorMessage}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-[#A8001A] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Ingresando...' : 'Entrar al panel'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8 lg:px-8">
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message ?? ''}
        confirmLabel={confirmState?.confirmLabel}
        destructive={confirmState?.destructive}
        details={confirmState?.details}
        detailsTitle={confirmState?.detailsTitle}
        confirmText={confirmState?.confirmText}
        secondaryAction={confirmState?.secondaryAction}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="flex flex-col gap-6 rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm lg:w-64 lg:shrink-0 lg:p-5">
          <div>
            <h1 className="font-serif text-[22px] font-semibold leading-[1.3] text-[#1A1418]">Panel administrativo</h1>
            <p className="mt-1 break-all text-xs font-medium text-[#5C5257]">Sesión iniciada como {userEmail}</p>
          </div>

          {adminState === 'granted' ? (
            <nav aria-label="Secciones del panel" className="flex flex-wrap gap-1 lg:flex-col">
              {ADMIN_SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setInstagramTab(undefined);
                      setActiveSection(section.id);
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors duration-150 ease-out ${
                      isActive
                        ? 'bg-[#A8001A] text-[#FFF8F5]'
                        : 'text-[#1A1418] hover:bg-[#A8001A]/5 hover:text-[#A8001A]'
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          ) : null}

          <button
            type="button"
            onClick={handleSignOut}
            className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#A8001A] px-4 text-sm font-medium text-[#A8001A] lg:mt-2"
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
            Cerrar sesión
          </button>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
      {adminState === 'checking' ? (
        <div className="rounded-2xl border border-[#1A1418]/10 bg-white p-6 text-[#1A1418]">Validando permisos admin...</div>
      ) : null}

      {adminState === 'missing-config' ? (
        <div className="rounded-2xl border border-[#F3C9C5] bg-[#FDECEA] p-6 text-[#8C1D18]">
          {errorMessage || 'Falta configurar migraciones de administracion en Supabase.'}
        </div>
      ) : null}

      {adminState === 'denied' ? (
        <div className="rounded-2xl border border-[#F3C9C5] bg-[#FDECEA] p-6 text-[#8C1D18]">
          {errorMessage || 'No tienes permisos para administrar este modulo.'}
        </div>
      ) : null}

      {adminState === 'granted' ? (
        <div className="space-y-6">
          <Toast toast={toast} onDismiss={() => setToast(null)} />

          {showPhotoWizard ? (
            <Suspense fallback={null}>
              <CrearDesdeFoto onCancel={() => setShowPhotoWizard(false)} onComplete={handleAiDraftComplete} />
            </Suspense>
          ) : null}

          {activeSection === 'resumen' ? (
            <Suspense fallback={<p className="text-sm text-[#5C5257]">Cargando resumen...</p>}>
              <ResumenSection
                costumes={costumes}
                onCreateNew={() => {
                  handleCreateNew();
                  setActiveSection('disfraces');
                }}
                onCreateFromPhoto={handleOpenPhotoWizard}
                onOpenCostume={handleNavigateToCostumeFromInsights}
                onGoToInsights={() => setActiveSection('insights')}
                onGoToCostumes={() => setActiveSection('disfraces')}
                onGoToInstagram={() => openInstagram('calendario')}
              />
            </Suspense>
          ) : null}

          {activeSection === 'disfraces' ? (
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6">
              <div
                className="flex flex-col self-start overflow-hidden rounded-2xl border border-[#1A1418]/10 bg-white p-4 shadow-sm"
                style={
                  disfracesLeftColumnHeight
                    ? { maxHeight: `${disfracesLeftColumnHeight}px` }
                    : { maxHeight: '80vh' }
                }
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-xl text-[#1A1418]">Disfraces</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-[#1A1418]/20 p-1">
                      {(
                        [
                          { id: 'tabla', label: 'Tabla' },
                          { id: 'lista', label: 'Lista' },
                          { id: 'galeria', label: 'Galeria' },
                        ] as const
                      ).map((mode) => (
                        <button
                          key={mode.id}
                          onClick={() => setViewMode(mode.id)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                            viewMode === mode.id
                              ? 'bg-[#A8001A] text-white'
                              : 'text-[#1A1418] hover:bg-[#A8001A]/5'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleCreateNew}
                      className="rounded-lg bg-[#A8001A] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Nuevo
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenPhotoWizard}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#A8001A] px-3 py-1.5 text-xs font-semibold text-[#A8001A]"
                    >
                      <Camera size={14} strokeWidth={1.75} aria-hidden="true" />
                      Desde foto
                    </button>
                  </div>
                </div>

                <input
                  value={costumeSearchQuery}
                  onChange={(event) => setCostumeSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre, slug o categoria..."
                  className="mb-3 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                />

                {isLoadingPanelData ? <p className="text-sm text-[#5C5257]">Cargando catalogo...</p> : null}

                {viewMode === 'lista' ? (
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAdminCostumes.map((costume) => (
                      <article
                        key={costume.id}
                        className={`rounded-xl border p-3 ${
                          costume.id === selectedCostumeId
                            ? 'border-[#A8001A] bg-[#A8001A]/5'
                            : 'border-[#1A1418]/10 bg-white'
                        }`}
                      >
                        <button
                          className="w-full text-left"
                          onClick={() => hydrateFormFromCostume(costume)}
                        >
                          <h3 className="text-sm font-semibold text-[#1A1418]">{costume.name}</h3>
                          <p className="mt-1 text-xs text-[#5C5257]">
                            {costume.category_name ?? 'Sin categoria'}
                          </p>
                          {costume.is_available && costume.image_count === 1 ? (
                            <span
                              title="Tiene una sola foto: no entra en las campañas de Instagram de un disfraz por carrusel."
                              className="mt-1 inline-block rounded-full border border-[#1A1418]/20 px-2 py-0.5 text-[11px] font-medium text-[#5C5257]"
                            >
                              1 foto
                            </span>
                          ) : null}
                        </button>

                        <div className="mt-2 flex flex-col items-start gap-1.5">
                          <button
                            onClick={() => handleToggleFromList(costume, 'is_available')}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.is_available
                                ? 'bg-[#EAF8EE] text-[#1B6F3A]'
                                : 'bg-[#FDECEA] text-[#B3261E]'
                            }`}
                          >
                            {costume.is_available ? 'Disponible' : 'No disponible'}
                          </button>
                          <button
                            onClick={() => handleToggleFromList(costume, 'featured')}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.featured
                                ? 'bg-[#FDC003] text-[#1A1418]'
                                : 'bg-[#1A1418]/5 text-[#5C5257]'
                            }`}
                          >
                            {costume.featured ? 'Destacado' : 'Normal'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}

                {viewMode === 'tabla' ? (
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#1A1418]/10">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-[#FFF8F5] text-xs font-semibold uppercase tracking-wide text-[#5C5257]">
                        <tr>
                          <th className="px-3 py-2">Disfraz</th>
                          <th className="px-3 py-2 text-right">Precios</th>
                          <th className="px-2 py-2">Disponible</th>
                          <th className="px-2 py-2">
                            <span className="sr-only">Destacado</span>
                            <Star size={14} strokeWidth={1.75} aria-hidden="true" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminCostumes.map((costume) => (
                          <tr
                            key={costume.id}
                            className={`border-t border-[#1A1418]/10 ${
                              costume.id === selectedCostumeId ? 'bg-[#A8001A]/5' : 'bg-white'
                            }`}
                          >
                            <td className="px-3 py-2">
                              <button
                                onClick={() => hydrateFormFromCostume(costume)}
                                className="text-left font-semibold text-[#1A1418] hover:text-[#A8001A]"
                              >
                                {costume.name}
                                <span className="block text-xs font-normal text-[#5C5257]">
                                  {costume.category_name ?? 'Sin categoria'}
                                </span>
                                {costume.is_available && costume.image_count === 1 ? (
                            <span
                              title="Tiene una sola foto: no entra en las campañas de Instagram de un disfraz por carrusel."
                              className="mt-1 inline-block font-normal rounded-full border border-[#1A1418]/20 px-2 py-0.5 text-[11px] font-medium text-[#5C5257]"
                            >
                              1 foto
                            </span>
                          ) : null}
                              </button>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right">
                              {costume.rental_price !== null ? (
                                <span className="block font-mono font-medium text-[#1A1418]">{formatCOP(costume.rental_price)}</span>
                              ) : (
                                <span className="block text-xs font-medium text-[#5C5257]">Solo venta</span>
                              )}
                              {costume.deposit_price !== null ? (
                                <span className="block font-mono text-xs text-[#5C5257]">Dep. {formatCOP(costume.deposit_price)}</span>
                              ) : (
                                <span className="block text-xs font-medium text-[#B3261E]">Sin depósito</span>
                              )}
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={costume.is_available}
                                aria-label={`Disponible: ${costume.name}`}
                                onClick={() => handleToggleFromList(costume, 'is_available')}
                                className="flex min-h-10 items-center gap-2 text-xs font-medium text-[#1A1418]"
                              >
                                <span
                                  aria-hidden="true"
                                  className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-150 ease-out ${
                                    costume.is_available ? 'bg-[#1B6F3A]' : 'bg-[#1A1418]/20'
                                  }`}
                                >
                                  <span
                                    className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all duration-150 ease-out ${
                                      costume.is_available ? 'left-[19px]' : 'left-[3px]'
                                    }`}
                                  />
                                </span>
                                {costume.is_available ? 'Sí' : 'Oculto'}
                              </button>
                            </td>
                            <td className="px-2 py-2">
                              <button
                                type="button"
                                aria-pressed={costume.featured}
                                aria-label={`Destacado: ${costume.name}`}
                                onClick={() => handleToggleFromList(costume, 'featured')}
                                className="flex h-10 w-10 items-center justify-center rounded-lg"
                              >
                                <Star
                                  size={20}
                                  strokeWidth={1.75}
                                  aria-hidden="true"
                                  className={costume.featured ? 'fill-[#FDC003] text-[#987302]' : 'text-[#5C5257]'}
                                />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {viewMode === 'galeria' ? (
                  <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAdminCostumes.map((costume) => (
                      <article
                        key={costume.id}
                        className={`cursor-pointer rounded-xl border p-3 ${
                          costume.id === selectedCostumeId
                            ? 'border-[#A8001A] bg-[#A8001A]/5'
                            : 'border-[#1A1418]/10 bg-white'
                        }`}
                        onClick={() => hydrateFormFromCostume(costume)}
                      >
                        <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg bg-[#1A1418]/5">
                          {costume.primary_image ? (
                            <img
                              src={getAdminImageUrl(costume.primary_image)}
                              alt={costume.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-[#5C5257]">Sin imagen</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-[#1A1418]">{costume.name}</h3>
                        <p className="text-xs text-[#5C5257]">{costume.category_name ?? 'Sin categoria'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFromList(costume, 'is_available');
                            }}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.is_available
                                ? 'bg-[#EAF8EE] text-[#1B6F3A]'
                                : 'bg-[#FDECEA] text-[#B3261E]'
                            }`}
                          >
                            {costume.is_available ? 'Disponible' : 'No disponible'}
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFromList(costume, 'featured');
                            }}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.featured
                                ? 'bg-[#FDC003] text-[#1A1418]'
                                : 'bg-[#1A1418]/5 text-[#5C5257]'
                            }`}
                          >
                            {costume.featured ? 'Destacado' : 'Normal'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-6" ref={disfracesRightColumnRef}>
              {aiDraft ? (
                <section
                  aria-labelledby="borrador-ia"
                  className="rounded-2xl border-2 border-[#FDC003] bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {aiPhotoUrl ? (
                      <img
                        src={aiPhotoUrl}
                        alt={aiDraft.altText || 'Foto del disfraz editada con IA'}
                        className="h-48 w-36 shrink-0 self-center rounded-lg border border-[#1A1418]/10 object-cover sm:self-start"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 id="borrador-ia" className="font-serif text-[22px] font-semibold leading-[1.3] text-[#1A1418]">
                            {aiDraft.pendingForCostumeId ? 'Falta completar el disfraz' : 'Borrador desde foto'}
                          </h2>
                          <p className="mt-1 text-sm leading-[1.6] text-[#5C5257]">
                            {aiDraft.pendingForCostumeId
                              ? 'El disfraz ya existe. Reintenta para guardar lo que faltó.'
                              : aiDraft.aiFields.length
                                ? 'Los campos resaltados los sugirió la IA. Revísalos antes de guardar: al guardar se crean también la ficha técnica y la foto principal.'
                                : 'Completa el formulario y guarda: la foto quedará como principal del disfraz.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDiscardAiDraft}
                          className="shrink-0 text-sm font-medium text-[#5C5257] hover:text-[#A8001A]"
                        >
                          Descartar
                        </button>
                      </div>

                      <label className="block text-sm font-medium text-[#1A1418]">
                        Texto alternativo de la foto
                        <input
                          value={aiDraft.altText}
                          onChange={(event) =>
                            setAiDraft((prev) => (prev ? { ...prev, altText: event.target.value } : prev))
                          }
                          placeholder="Ej.: Disfraz de Marimonda con sombrilla, vista de frente"
                          className={`mt-1.5 min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 text-base text-[#1A1418] outline-none focus:border-[#A8001A]${aiDraft.altText && !aiDraft.pendingForCostumeId ? ' ring-2 ring-[#FDC003]' : ''}`}
                        />
                      </label>

                      {aiDraft.newFabrics.length || aiDraft.newAccessories.length ? (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[#1A1418]">Nuevos en la descripción — ¿crearlos?</p>
                          <div className="flex flex-wrap gap-2">
                            {aiDraft.newFabrics.map((name) => (
                              <span key={`fabric-${name}`} className="inline-flex items-center gap-1 rounded-full border border-[#1A1418]/20 bg-white py-1 pl-3 pr-1 text-xs font-medium text-[#1A1418]">
                                Tela: {name}
                                <button type="button" onClick={() => handleCreateSuggested('fabric', name)} className="min-h-8 rounded-full bg-[#A8001A] px-2.5 text-[#FFF8F5]">Crear</button>
                                <button type="button" aria-label={`Ignorar tela ${name}`} onClick={() => handleDismissSuggested('fabric', name)} className="min-h-8 px-2 text-[#5C5257]">✕</button>
                              </span>
                            ))}
                            {aiDraft.newAccessories.map((name) => (
                              <span key={`accessory-${name}`} className="inline-flex items-center gap-1 rounded-full border border-[#1A1418]/20 bg-white py-1 pl-3 pr-1 text-xs font-medium text-[#1A1418]">
                                Accesorio: {name}
                                <button type="button" onClick={() => handleCreateSuggested('accessory', name)} className="min-h-8 rounded-full bg-[#A8001A] px-2.5 text-[#FFF8F5]">Crear</button>
                                <button type="button" aria-label={`Ignorar accesorio ${name}`} onClick={() => handleDismissSuggested('accessory', name)} className="min-h-8 px-2 text-[#5C5257]">✕</button>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {aiDraft.notes ? (
                        <p className="rounded-lg bg-[#FFF8F5] p-3 text-sm leading-[1.6] text-[#1A1418]">
                          <span className="font-medium">Notas de la descripción:</span> {aiDraft.notes}
                        </p>
                      ) : null}

                      {aiDraft.pendingForCostumeId ? (
                        <button
                          type="button"
                          onClick={() => void handleRetryAiExtras()}
                          disabled={isRetryingAiExtras}
                          className="min-h-11 rounded-lg bg-[#A8001A] px-5 text-sm font-medium text-[#FFF8F5] disabled:opacity-60"
                        >
                          {isRetryingAiExtras ? 'Guardando...' : 'Reintentar'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : null}
              <form
              onSubmit={handleSaveCostume}
              className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-[28px] font-semibold leading-[1.25] text-[#1A1418]">
                  {selectedCostumeId ? 'Editar disfraz' : 'Nuevo disfraz'}
                </h2>
                {selectedCostumeId ? (
                  <button
                    type="button"
                    onClick={handleDeleteCostume}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-[#5C5257] transition-colors duration-150 ease-out hover:text-[#B3261E]"
                  >
                    <Trash2 size={18} strokeWidth={1.75} aria-hidden="true" />
                    Eliminar u ocultar
                  </button>
                ) : null}
              </div>

              <fieldset className="space-y-4">
                <legend className="mb-3 text-xs font-medium uppercase tracking-wide text-[#5C5257]">Datos básicos</legend>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block text-sm font-medium text-[#1A1418]">
                    Nombre del disfraz
                    <input
                      value={form.name}
                      onChange={(event) => handleFormField('name', event.target.value)}
                      placeholder="Ej.: Marimonda de Barrio Abajo"
                      className={`mt-1.5 min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 text-base text-[#1A1418] outline-none focus:border-[#A8001A]${aiRing('name')}`}
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-[#1A1418]">
                    Dirección en el sitio
                    <span className="mt-1.5 flex min-h-11 items-center rounded-lg border border-[#1A1418]/20 bg-[#FFF8F5] focus-within:border-[#A8001A]">
                      <span aria-hidden="true" className="pl-3 pr-1 font-mono text-xs text-[#5C5257]">/catalogo/</span>
                      <input
                        value={form.slug}
                        onChange={(event) => handleFormField('slug', slugify(event.target.value))}
                        className="w-full min-w-0 bg-transparent pr-3 font-mono text-[13px] tracking-[0.5px] text-[#1A1418] outline-none"
                        required
                      />
                    </span>
                    <span className="mt-1 block text-xs font-medium text-[#5C5257]">
                      Se arma sola con el nombre. Cámbiala solo si hace falta.
                    </span>
                  </label>

                  <label className="block text-sm font-medium text-[#1A1418]">
                    Categoría
                    <select
                      value={form.category_id}
                      onChange={(event) => handleFormField('category_id', event.target.value)}
                      className={`mt-1.5 min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 text-base text-[#1A1418] outline-none focus:border-[#A8001A]${aiRing('category_id')}`}
                      required
                    >
                      <option value="">Selecciona</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-[#1A1418]">
                    Diseñadora
                    <select
                      value={form.designer_id}
                      onChange={(event) => handleFormField('designer_id', event.target.value)}
                      className={`mt-1.5 min-h-11 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 text-base text-[#1A1418] outline-none focus:border-[#A8001A]${aiRing('designer_id')}`}
                    >
                      <option value="">Sin asignar</option>
                      {designers.map((designer) => (
                        <option key={designer.id} value={designer.id}>
                          {designer.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm font-medium text-[#1A1418] md:col-span-2">
                    Descripción
                    <textarea
                      value={form.description}
                      onChange={(event) => handleFormField('description', event.target.value)}
                      placeholder="Cuéntale a la clienta qué hace especial este disfraz y qué incluye."
                      className={`mt-1.5 min-h-28 w-full rounded-lg border border-[#1A1418]/20 bg-white px-3 py-2.5 text-base leading-[1.7] text-[#1A1418] outline-none focus:border-[#A8001A]${aiRing('description')}`}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="mt-6 space-y-4 border-t border-[#1A1418]/10 pt-5">
                <legend className="sr-only">Precios</legend>
                <p aria-hidden="true" className="text-xs font-medium uppercase tracking-wide text-[#5C5257]">Precios</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block text-sm font-medium text-[#1A1418]">
                    Alquiler
                    <span className={`mt-1.5 flex min-h-11 items-center rounded-lg border border-[#1A1418]/20 bg-white px-3 focus-within:border-[#A8001A]${aiRing('rental_price')}`}>
                      <input
                        value={formatCOPInput(form.rental_price)}
                        onChange={(event) => handleFormField('rental_price', parseCOPInput(event.target.value))}
                        className="w-full min-w-0 bg-transparent font-mono text-base font-medium text-[#1A1418] outline-none"
                        type="text"
                        inputMode="numeric"
                      />
                    </span>
                    <span className="mt-1 block text-xs font-medium text-[#5C5257]">Vacío = se publica solo el precio de venta.</span>
                  </label>
                  <label className="block text-sm font-medium text-[#1A1418]">
                    Venta
                    <span className={`mt-1.5 flex min-h-11 items-center rounded-lg border border-[#1A1418]/20 bg-white px-3 focus-within:border-[#A8001A]${aiRing('sale_price')}`}>
                      <input
                        value={formatCOPInput(form.sale_price)}
                        onChange={(event) => handleFormField('sale_price', parseCOPInput(event.target.value))}
                        className="w-full min-w-0 bg-transparent font-mono text-base font-medium text-[#1A1418] outline-none"
                        type="text"
                        inputMode="numeric"
                      />
                    </span>
                  </label>
                  <label className="block text-sm font-medium text-[#1A1418]">
                    Depósito reembolsable
                    <span className={`mt-1.5 flex min-h-11 items-center rounded-lg border border-[#1A1418]/20 bg-white px-3 focus-within:border-[#A8001A]${aiRing('deposit_price')}`}>
                      <input
                        value={formatCOPInput(form.deposit_price)}
                        onChange={(event) => handleFormField('deposit_price', parseCOPInput(event.target.value))}
                        className="w-full min-w-0 bg-transparent font-mono text-base font-medium text-[#1A1418] outline-none"
                        type="text"
                        inputMode="numeric"
                      />
                    </span>
                  </label>
                </div>
              </fieldset>

              <fieldset className="mt-6 border-t border-[#1A1418]/10 pt-5">
                <legend className="sr-only">Visibilidad</legend>
                <p aria-hidden="true" className="mb-1 text-xs font-medium uppercase tracking-wide text-[#5C5257]">Visibilidad</p>
                <div className="grid gap-x-6 md:grid-cols-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.is_available}
                  onClick={() => handleFormField('is_available', !form.is_available)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 text-left"
                >
                  <span>
                    <span className="block text-sm font-medium text-[#1A1418]">Disponible en el catálogo</span>
                    <span className="block text-xs font-medium text-[#5C5257]">Si lo apagas, el disfraz no aparece en el sitio.</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-out ${
                      form.is_available ? 'bg-[#1B6F3A]' : 'bg-[#1A1418]/20'
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all duration-150 ease-out ${
                        form.is_available ? 'left-[23px]' : 'left-[3px]'
                      }`}
                    />
                  </span>
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.featured}
                  onClick={() => handleFormField('featured', !form.featured)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 text-left"
                >
                  <span>
                    <span className="block text-sm font-medium text-[#1A1418]">Destacado en inicio</span>
                    <span className="block text-xs font-medium text-[#5C5257]">Aparece entre los favoritos de la temporada.</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-out ${
                      form.featured ? 'bg-[#1B6F3A]' : 'bg-[#1A1418]/20'
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all duration-150 ease-out ${
                        form.featured ? 'left-[23px]' : 'left-[3px]'
                      }`}
                    />
                  </span>
                </button>
                </div>
              </fieldset>

              <div className="mt-6 flex justify-end border-t border-[#1A1418]/10 pt-5">
                <button
                  type="submit"
                  disabled={isSavingCostume}
                  className="min-h-11 rounded-lg bg-[#A8001A] px-6 text-[15px] font-medium text-[#FFF8F5] transition-colors duration-150 ease-out hover:bg-[#860015] disabled:opacity-60"
                >
                  {isSavingCostume ? 'Guardando...' : selectedCostumeId ? 'Guardar cambios' : 'Guardar disfraz'}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#1A1418]">Galeria de imagenes</h2>
                <label className="rounded-lg bg-[#1A1418] px-3 py-2 text-xs font-semibold text-white">
                  Cargar imagenes
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={!selectedCostumeId || isUploadingImages}
                    onChange={(event) => handleUploadImages(event.target.files)}
                  />
                </label>
              </div>

              {!selectedCostumeId ? (
                <p className="text-sm text-[#5C5257]">Guarda primero un disfraz para habilitar su galeria.</p>
              ) : null}

              {isLoadingImages ? <p className="text-sm text-[#5C5257]">Cargando imagenes...</p> : null}

              {uploadQueue.length > 0 ? (
                <ul className="mt-3 space-y-1.5 rounded-lg border border-[#1A1418]/10 p-3">
                  {uploadQueue.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-[#1A1418]">
                        {index + 1}/{uploadQueue.length} {item.name}
                      </span>
                      <span
                        className={
                          item.status === 'error'
                            ? 'font-semibold text-red-600'
                            : item.status === 'done'
                            ? 'font-semibold text-green-700'
                            : item.status === 'uploading'
                            ? 'font-semibold text-[#A8001A]'
                            : 'text-[#5C5257]'
                        }
                      >
                        {item.status === 'pending' && 'En espera'}
                        {item.status === 'uploading' && 'Subiendo...'}
                        {item.status === 'done' && 'Listo'}
                        {item.status === 'error' && (item.error ?? 'Error')}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-4 grid max-h-[1465px] gap-4 overflow-y-auto pr-1 md:grid-cols-2 xl:grid-cols-3">
                {images.map((image, index) => (
                  <article key={image.id} className="rounded-xl border border-[#1A1418]/10 p-3">
                    <img
                      src={getAdminImageUrl(image.storage_path)}
                      alt={image.alt_text ?? 'Imagen del disfraz'}
                      className="aspect-[4/5] w-full rounded-lg object-cover"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={image.is_primary ? 'font-semibold text-[#A8001A]' : 'text-[#5C5257]'}>
                        {image.is_primary ? 'Principal' : `Orden ${image.sort_order + 1}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveImage(image.id, 'up')}
                          className="rounded border border-[#1A1418]/20 px-2 py-1 disabled:opacity-40"
                        >
                          Subir
                        </button>
                        <button
                          disabled={index === images.length - 1}
                          onClick={() => handleMoveImage(image.id, 'down')}
                          className="rounded border border-[#1A1418]/20 px-2 py-1 disabled:opacity-40"
                        >
                          Bajar
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={altDrafts[image.id] ?? ''}
                        onChange={(event) => handleAltTextChange(image, event.target.value)}
                        onBlur={() => handleAltTextBlur(image)}
                        placeholder="Texto alternativo"
                        className="w-full rounded-lg border border-[#1A1418]/20 px-2 py-1 text-xs"
                      />
                      <span
                        className={
                          altSaveStatus[image.id] === 'error'
                            ? 'shrink-0 text-[10px] font-semibold text-red-600'
                            : altSaveStatus[image.id] === 'saving'
                            ? 'shrink-0 text-[10px] font-semibold text-[#5C5257]'
                            : altSaveStatus[image.id] === 'saved'
                            ? 'shrink-0 text-[10px] font-semibold text-green-700'
                            : 'shrink-0 text-[10px] text-transparent'
                        }
                      >
                        {altSaveStatus[image.id] === 'saving' && 'Guardando...'}
                        {altSaveStatus[image.id] === 'saved' && 'Guardado'}
                        {altSaveStatus[image.id] === 'error' && 'Error'}
                        {(!altSaveStatus[image.id] || altSaveStatus[image.id] === 'idle') && '—'}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAltTextBlur(image)}
                        className="rounded border border-[#1A1418] px-2 py-1 text-xs text-[#1A1418]"
                      >
                        Guardar alt
                      </button>
                      {!image.is_primary ? (
                        <button
                          onClick={() => handleSetPrimary(image.id)}
                          className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                        >
                          Marcar principal
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDeleteImage(image)}
                        className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#1A1418]">Ficha tecnica del disfraz</h2>
                <button
                  type="button"
                  onClick={handleSaveRelations}
                  disabled={!selectedCostumeId || isSavingRelations}
                  className="rounded-lg bg-[#1A1418] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSavingRelations ? 'Guardando...' : 'Guardar ficha'}
                </button>
              </div>

              {!selectedCostumeId && aiDraft ? (
                <p className="mb-4 rounded-lg bg-[#FFF8F5] p-3 text-sm leading-[1.6] text-[#1A1418]">
                  Revisa lo que sugirió la IA: la ficha técnica se guarda junto con el disfraz.
                </p>
              ) : null}

              {!selectedCostumeId && !aiDraft ? (
                <p className="text-sm text-[#5C5257]">Selecciona o crea un disfraz para editar su ficha tecnica.</p>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#1A1418]">Detalles visibles</h3>
                    <p className="mt-1 text-xs text-[#5C5257]">Un detalle por linea, en el orden deseado.</p>
                    <textarea
                      value={detailsText}
                      onChange={(event) => setDetailsText(event.target.value)}
                      className="mt-2 min-h-36 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                      placeholder={'Incluye tocado artesanal\nForro interno transpirable\nIdeal para comparsa'}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1418]">Telas</h3>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={newFabricName}
                          onChange={(event) => setNewFabricName(event.target.value)}
                          placeholder="Nueva tela"
                          className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCreateFabric}
                          className="rounded-lg border border-[#1A1418] px-3 py-2 text-xs font-semibold text-[#1A1418]"
                        >
                          Crear
                        </button>
                      </div>
                      <div className="mt-2 grid max-h-32 gap-1 overflow-auto rounded-lg border border-[#1A1418]/10 p-2 text-sm">
                        {fabrics.map((fabric) => (
                          <label key={fabric.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedFabricIds.includes(fabric.id)}
                              onChange={() =>
                                toggleSelection(selectedFabricIds, fabric.id, setSelectedFabricIds)
                              }
                            />
                            {fabric.name}
                          </label>
                        ))}
                      </div>
                      {selectedFabricIds.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {fabrics
                            .filter((fabric) => selectedFabricIds.includes(fabric.id))
                            .map((fabric) => (
                              <span
                                key={fabric.id}
                                className="rounded-full border border-[#A8001A]/30 bg-[#A8001A]/5 px-2.5 py-1 text-xs font-semibold text-[#A8001A]"
                              >
                                {fabric.name}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1418]">Accesorios</h3>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={newAccessoryName}
                          onChange={(event) => setNewAccessoryName(event.target.value)}
                          placeholder="Nuevo accesorio"
                          className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCreateAccessory}
                          className="rounded-lg border border-[#1A1418] px-3 py-2 text-xs font-semibold text-[#1A1418]"
                        >
                          Crear
                        </button>
                      </div>
                      <div className="mt-2 grid max-h-32 gap-1 overflow-auto rounded-lg border border-[#1A1418]/10 p-2 text-sm">
                        {accessories.map((accessory) => (
                          <label key={accessory.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedAccessoryIds.includes(accessory.id)}
                              onChange={() =>
                                toggleSelection(
                                  selectedAccessoryIds,
                                  accessory.id,
                                  setSelectedAccessoryIds
                                )
                              }
                            />
                            {accessory.name}
                          </label>
                        ))}
                      </div>
                      {selectedAccessoryIds.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {accessories
                            .filter((accessory) => selectedAccessoryIds.includes(accessory.id))
                            .map((accessory) => (
                              <span
                                key={accessory.id}
                                className="rounded-full border border-[#A8001A]/30 bg-[#A8001A]/5 px-2.5 py-1 text-xs font-semibold text-[#A8001A]"
                              >
                                {accessory.name}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#1A1418]">Tallas disponibles</h3>
                      {[
                        { label: 'Adulto', sizes: SIZE_OPTIONS.filter((size) => Number.isNaN(Number(size))) },
                        { label: 'Niño', sizes: SIZE_OPTIONS.filter((size) => !Number.isNaN(Number(size))) },
                      ].map((group) => (
                        <div key={group.label} className="mt-3" role="group" aria-label={`Tallas ${group.label.toLowerCase()}`}>
                          <p className="text-xs font-medium text-[#5C5257]">{group.label}</p>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {group.sizes.map((size) => {
                              const isSelected = selectedSizes.includes(size);
                              return (
                                <button
                                  key={size}
                                  type="button"
                                  aria-pressed={isSelected}
                                  onClick={() => toggleSize(size)}
                                  className={`min-h-10 min-w-12 rounded-lg border px-3 font-mono text-sm font-medium transition-colors duration-150 ease-out ${
                                    isSelected
                                      ? 'border-[#A8001A] bg-[#A8001A] text-[#FFF8F5]'
                                      : 'border-[#1A1418]/20 bg-white text-[#1A1418] hover:border-[#A8001A]'
                                  }`}
                                >
                                  {size}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
              </div>
            </div>
          ) : null}

          {activeSection === 'telas-accesorios' ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
                <h2 className="font-serif text-xl text-[#1A1418]">Telas</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newFabricNameTab}
                    onChange={(event) => setNewFabricNameTab(event.target.value)}
                    placeholder="Nueva tela"
                    className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFabricTab}
                    className="rounded-lg border border-[#1A1418] px-3 py-2 text-xs font-semibold text-[#1A1418]"
                  >
                    Crear
                  </button>
                </div>
                <input
                  value={fabricSearchQuery}
                  onChange={(event) => setFabricSearchQuery(event.target.value)}
                  placeholder="Buscar tela..."
                  className="mt-3 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                />
                <ul className="mt-4 space-y-2">
                  {filteredFabrics.map((fabric) => (
                    <li
                      key={fabric.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#1A1418]/10 px-3 py-2"
                    >
                      {editingFabric?.id === fabric.id ? (
                        <input
                          value={editingFabric.name}
                          onChange={(event) => setEditingFabric({ id: fabric.id, name: event.target.value })}
                          className="w-full rounded-lg border border-[#1A1418]/20 px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-[#1A1418]">{fabric.name}</span>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        <UsageTooltip costumeNames={fabricUsage.get(fabric.id) ?? []} />
                        {editingFabric?.id === fabric.id ? (
                          <button
                            onClick={() => handleUpdateFabric(fabric.id, editingFabric.name)}
                            className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                          >
                            Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingFabric({ id: fabric.id, name: fabric.name })}
                            className="rounded border border-[#1A1418] px-2 py-1 text-xs text-[#1A1418]"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteFabric(fabric.id, fabric.name)}
                          className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
                <h2 className="font-serif text-xl text-[#1A1418]">Accesorios</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newAccessoryNameTab}
                    onChange={(event) => setNewAccessoryNameTab(event.target.value)}
                    placeholder="Nuevo accesorio"
                    className="w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAccessoryTab}
                    className="rounded-lg border border-[#1A1418] px-3 py-2 text-xs font-semibold text-[#1A1418]"
                  >
                    Crear
                  </button>
                </div>
                <input
                  value={accessorySearchQuery}
                  onChange={(event) => setAccessorySearchQuery(event.target.value)}
                  placeholder="Buscar accesorio..."
                  className="mt-3 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                />
                <ul className="mt-4 space-y-2">
                  {filteredAccessories.map((accessory) => (
                    <li
                      key={accessory.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#1A1418]/10 px-3 py-2"
                    >
                      {editingAccessory?.id === accessory.id ? (
                        <input
                          value={editingAccessory.name}
                          onChange={(event) =>
                            setEditingAccessory({ id: accessory.id, name: event.target.value })
                          }
                          className="w-full rounded-lg border border-[#1A1418]/20 px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-[#1A1418]">{accessory.name}</span>
                      )}
                      <div className="flex shrink-0 items-center gap-1">
                        <UsageTooltip costumeNames={accessoryUsage.get(accessory.id) ?? []} />
                        {editingAccessory?.id === accessory.id ? (
                          <button
                            onClick={() => handleUpdateAccessory(accessory.id, editingAccessory.name)}
                            className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                          >
                            Guardar
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingAccessory({ id: accessory.id, name: accessory.name })}
                            className="rounded border border-[#1A1418] px-2 py-1 text-xs text-[#1A1418]"
                          >
                            Editar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAccessory(accessory.id, accessory.name)}
                          className="rounded border border-[#A8001A] px-2 py-1 text-xs text-[#A8001A]"
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {activeSection === 'insights' ? (
            <Suspense fallback={<p className="text-sm text-[#5C5257]">Cargando Insights...</p>}>
              <InsightsSection onNavigateToCostume={handleNavigateToCostumeFromInsights} />
            </Suspense>
          ) : null}

          {activeSection === 'instagram' ? (
            <Suspense fallback={<p className="text-sm text-[#5C5257]">Cargando Instagram...</p>}>
              <InstagramSection
                costumes={costumes}
                categories={categories}
                userId={session?.user?.id ?? null}
                initialTab={instagramTab}
                onOpenCostume={handleNavigateToCostumeFromInsights}
                notify={notify}
                notifyError={notifyError}
                requestConfirm={requestConfirm}
              />
            </Suspense>
          ) : null}

          {activeSection === 'configuracion' ? (
            <section className="rounded-2xl border border-[#1A1418]/10 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#1A1418]">Configuracion del sitio</h2>
                <button
                  type="button"
                  onClick={handleSaveSiteConfig}
                  disabled={isSavingSiteConfig}
                  className="rounded-lg bg-[#A8001A] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSavingSiteConfig ? 'Guardando...' : 'Guardar configuracion'}
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#1A1418]">Estadisticas</h3>
                  <label className="block text-sm text-[#1A1418]">
                    Anos de tradicion
                    <input
                      value={siteStats.years_of_tradition}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, years_of_tradition: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Carnavales vividos
                    <input
                      value={siteStats.carnivals_lived}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, carnivals_lived: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Disfraces alquilados
                    <input
                      value={siteStats.costumes_rented}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, costumes_rented: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Corazones felices
                    <input
                      value={siteStats.happy_hearts}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, happy_hearts: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#1A1418]">Contacto</h3>
                  <label className="block text-sm text-[#1A1418]">
                    Direccion interna
                    <input
                      value={contactInfo.address}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, address: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Ciudad
                    <input
                      value={contactInfo.city}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, city: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Telefono
                    <input
                      value={contactInfo.phone}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    WhatsApp
                    <input
                      value={contactInfo.whatsapp}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, whatsapp: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#1A1418]">
                    Email
                    <input
                      value={contactInfo.email}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#1A1418]/20 px-3 py-2"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#1A1418]">Horarios de atencion</h3>
                  <button
                    type="button"
                    onClick={handleAddWorkingHour}
                    className="rounded-lg border border-[#1A1418] px-3 py-1 text-xs font-semibold text-[#1A1418]"
                  >
                    Agregar horario
                  </button>
                </div>
                <div className="space-y-2">
                  {workingHours.map((row, index) => (
                    <div key={`${index}-${row.days}`} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={row.days}
                        onChange={(event) => handleWorkingHourField(index, 'days', event.target.value)}
                        placeholder="Dias"
                        className="rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                      />
                      <input
                        value={row.hours}
                        onChange={(event) => handleWorkingHourField(index, 'hours', event.target.value)}
                        placeholder="Horario"
                        className="rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveWorkingHour(index)}
                        className="rounded-lg border border-[#A8001A] px-3 py-2 text-xs font-semibold text-[#A8001A]"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-[#1A1418]">Assets institucionales</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={newAssetKey}
                    onChange={(event) => setNewAssetKey(event.target.value)}
                    className="w-48 rounded-lg border border-[#1A1418]/20 px-3 py-2 text-sm"
                    placeholder="key del asset"
                  />
                  <label className="rounded-lg bg-[#1A1418] px-3 py-2 text-xs font-semibold text-white">
                    {isUploadingSiteAsset ? 'Subiendo...' : 'Subir asset'}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/svg+xml"
                      disabled={isUploadingSiteAsset}
                      onChange={(event) => handleUploadSiteAsset(event.target.files)}
                    />
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {siteAssets.map((asset) => (
                    <article key={asset.key} className="rounded-xl border border-[#1A1418]/10 p-3">
                      <p className="text-xs font-semibold text-[#1A1418]">{asset.key}</p>
                      <img
                        src={getSiteAssetUrl(asset.storage_path)}
                        alt={asset.key}
                        className="mt-2 h-24 w-full rounded-lg object-cover"
                      />
                    </article>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </div>
      ) : null}
        </div>
      </div>
    </section>
  );
}
