import React, { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin } from '../lib/supabase';
import Toast, { type ToastMessage, type ToastVariant } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
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
  createAccessory,
  createCostume,
  createFabric,
  deleteAccessory,
  deleteCostume,
  deleteCostumeImage,
  deleteFabric,
  fetchAdminCostumes,
  fetchAdminLookups,
  fetchCostumeRelations,
  fetchCostumeImages,
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
import { formatCOPInput, parseCOPInput } from '../utils/format';

const InsightsSection = lazy(() => import('./admin/InsightsSection'));

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
  const [confirmState, setConfirmState] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [activeSection, setActiveSection] = useState<
    'disfraces' | 'insights' | 'telas-accesorios' | 'configuracion'
  >('disfraces');
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
        setAdminState('denied');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const validateAdmin = async (userId: string) => {
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
        window.innerWidth >= 1024 ? node.getBoundingClientRect().height : undefined
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
    await supabaseAdmin.auth.signOut();
    setSession(null);
    setAdminState('denied');
  };

  const handleCreateNew = () => {
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
        const created = await createCostume(payload);
        setSelectedCostumeId(created.id);
        notify('Disfraz creado. Ya puedes gestionar su galeria.');
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

  const handleDeleteCostume = () => {
    if (!selectedCostumeId) {
      return;
    }

    setConfirmState({
      message: 'Se eliminara el disfraz y sus relaciones (detalles, tallas e imagenes). Deseas continuar?',
      onConfirm: async () => {
        setConfirmState(null);
        setToast(null);
        try {
          await deleteCostume(selectedCostumeId);
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
    } catch (error) {
      notifyError(error);
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
        <div className="rounded-2xl border border-[#E6D0C9] bg-white p-8 shadow-sm">
          <h1 className="font-serif text-3xl text-[#4A1F1F]">Acceso administrativo</h1>
          <p className="mt-2 text-sm text-[#6E4B4B]">
            Inicia sesion para gestionar catalogo e imagenes del Atelier.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSignIn}>
            <label className="block text-sm text-[#4A1F1F]" htmlFor="admin-email">
              Correo
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-[#3D1A1A] outline-none focus:border-[#A8001A]"
            />

            <label className="block text-sm text-[#4A1F1F]" htmlFor="admin-password">
              Contrasena
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-[#3D1A1A] outline-none focus:border-[#A8001A]"
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
    <section className="mx-auto w-full max-w-7xl px-4 py-10">
      <ConfirmDialog
        open={Boolean(confirmState)}
        message={confirmState?.message ?? ''}
        onConfirm={() => confirmState?.onConfirm()}
        onCancel={() => setConfirmState(null)}
      />

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-[#E6D0C9] bg-white p-6 shadow-sm">
        <div>
          <h1 className="font-serif text-3xl text-[#4A1F1F]">Panel administrativo</h1>
          <p className="mt-1 text-sm text-[#6E4B4B]">Sesion iniciada como {userEmail}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="rounded-lg border border-[#A8001A] px-4 py-2 text-sm font-semibold text-[#A8001A]"
        >
          Cerrar sesion
        </button>
      </div>

      {adminState === 'checking' ? (
        <div className="rounded-2xl border border-[#E6D0C9] bg-white p-6 text-[#4A1F1F]">Validando permisos admin...</div>
      ) : null}

      {adminState === 'missing-config' ? (
        <div className="rounded-2xl border border-[#F2D3D8] bg-[#FFF5F7] p-6 text-[#7A1C2C]">
          {errorMessage || 'Falta configurar migraciones de administracion en Supabase.'}
        </div>
      ) : null}

      {adminState === 'denied' ? (
        <div className="rounded-2xl border border-[#F2D3D8] bg-[#FFF5F7] p-6 text-[#7A1C2C]">
          {errorMessage || 'No tienes permisos para administrar este modulo.'}
        </div>
      ) : null}

      {adminState === 'granted' ? (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E6D0C9] bg-white p-2 shadow-sm">
            {(
              [
                { id: 'disfraces', label: 'Disfraces' },
                { id: 'insights', label: 'Insights' },
                { id: 'telas-accesorios', label: 'Telas y Accesorios' },
                { id: 'configuracion', label: 'Configuracion del sitio' },
              ] as const
            ).map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  activeSection === section.id
                    ? 'bg-[#A8001A] text-white'
                    : 'text-[#4A1F1F] hover:bg-[#FFF4F6]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <Toast toast={toast} onDismiss={() => setToast(null)} />

          {activeSection === 'disfraces' ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] gap-6">
              <div
                className="flex flex-col overflow-hidden rounded-2xl border border-[#E6D0C9] bg-white p-4 shadow-sm"
                style={
                  disfracesLeftColumnHeight
                    ? { height: `${disfracesLeftColumnHeight}px` }
                    : { maxHeight: '80vh' }
                }
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-serif text-xl text-[#4A1F1F]">Disfraces</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg border border-[#D6B8AE] p-1">
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
                              : 'text-[#4A1F1F] hover:bg-[#FFF4F6]'
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
                  </div>
                </div>

                <input
                  value={costumeSearchQuery}
                  onChange={(event) => setCostumeSearchQuery(event.target.value)}
                  placeholder="Buscar por nombre, slug o categoria..."
                  className="mb-3 w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                />

                {isLoadingPanelData ? <p className="text-sm text-[#6E4B4B]">Cargando catalogo...</p> : null}

                {viewMode === 'lista' ? (
                  <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredAdminCostumes.map((costume) => (
                      <article
                        key={costume.id}
                        className={`rounded-xl border p-3 ${
                          costume.id === selectedCostumeId
                            ? 'border-[#A8001A] bg-[#FFF4F6]'
                            : 'border-[#E6D0C9] bg-white'
                        }`}
                      >
                        <button
                          className="w-full text-left"
                          onClick={() => hydrateFormFromCostume(costume)}
                        >
                          <h3 className="text-sm font-semibold text-[#4A1F1F]">{costume.name}</h3>
                          <p className="mt-1 text-xs text-[#6E4B4B]">
                            {costume.category_name ?? 'Sin categoria'}
                          </p>
                        </button>

                        <div className="mt-2 flex flex-col items-start gap-1.5">
                          <button
                            onClick={() => handleToggleFromList(costume, 'is_available')}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.is_available
                                ? 'bg-[#EAF8EE] text-[#1B6F3A]'
                                : 'bg-[#FCEDED] text-[#9E2D2D]'
                            }`}
                          >
                            {costume.is_available ? 'Disponible' : 'No disponible'}
                          </button>
                          <button
                            onClick={() => handleToggleFromList(costume, 'featured')}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.featured
                                ? 'bg-[#FFF7DE] text-[#8B5D00]'
                                : 'bg-[#F3F0EF] text-[#6E4B4B]'
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
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[#EFE1DB]">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-[#FFF8F5] text-xs font-semibold uppercase tracking-wide text-[#6E4B4B]">
                        <tr>
                          <th className="px-3 py-2">Nombre</th>
                          <th className="px-3 py-2">Categoria</th>
                          <th className="px-3 py-2">Disponible</th>
                          <th className="px-3 py-2">Destacado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAdminCostumes.map((costume) => (
                          <tr
                            key={costume.id}
                            className={`border-t border-[#EFE1DB] ${
                              costume.id === selectedCostumeId ? 'bg-[#FFF4F6]' : 'bg-white'
                            }`}
                          >
                            <td className="px-3 py-2">
                              <button
                                onClick={() => hydrateFormFromCostume(costume)}
                                className="text-left font-semibold text-[#4A1F1F] hover:text-[#A8001A]"
                              >
                                {costume.name}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-[#6E4B4B]">{costume.category_name ?? 'Sin categoria'}</td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleToggleFromList(costume, 'is_available')}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                                  costume.is_available
                                    ? 'bg-[#EAF8EE] text-[#1B6F3A]'
                                    : 'bg-[#FCEDED] text-[#9E2D2D]'
                                }`}
                              >
                                {costume.is_available ? 'Disponible' : 'No disponible'}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={() => handleToggleFromList(costume, 'featured')}
                                className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                                  costume.featured
                                    ? 'bg-[#FFF7DE] text-[#8B5D00]'
                                    : 'bg-[#F3F0EF] text-[#6E4B4B]'
                                }`}
                              >
                                {costume.featured ? 'Destacado' : 'Normal'}
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
                            ? 'border-[#A8001A] bg-[#FFF4F6]'
                            : 'border-[#E6D0C9] bg-white'
                        }`}
                        onClick={() => hydrateFormFromCostume(costume)}
                      >
                        <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-lg bg-[#F3F0EF]">
                          {costume.primary_image ? (
                            <img
                              src={getAdminImageUrl(costume.primary_image)}
                              alt={costume.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-[#6E4B4B]">Sin imagen</span>
                          )}
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-[#4A1F1F]">{costume.name}</h3>
                        <p className="text-xs text-[#6E4B4B]">{costume.category_name ?? 'Sin categoria'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleFromList(costume, 'is_available');
                            }}
                            className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                              costume.is_available
                                ? 'bg-[#EAF8EE] text-[#1B6F3A]'
                                : 'bg-[#FCEDED] text-[#9E2D2D]'
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
                                ? 'bg-[#FFF7DE] text-[#8B5D00]'
                                : 'bg-[#F3F0EF] text-[#6E4B4B]'
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
              <form
              onSubmit={handleSaveCostume}
              className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#4A1F1F]">
                  {selectedCostumeId ? 'Editar disfraz' : 'Nuevo disfraz'}
                </h2>
                {selectedCostumeId ? (
                  <button
                    type="button"
                    onClick={handleDeleteCostume}
                    className="rounded-lg border border-[#A8001A] px-3 py-1.5 text-xs font-semibold text-[#A8001A]"
                  >
                    Eliminar
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm text-[#4A1F1F]">
                  Nombre
                  <input
                    value={form.name}
                    onChange={(event) => handleFormField('name', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm text-[#4A1F1F]">
                  Slug
                  <input
                    value={form.slug}
                    onChange={(event) => handleFormField('slug', slugify(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    required
                  />
                </label>

                <label className="text-sm text-[#4A1F1F]">
                  Categoria
                  <select
                    value={form.category_id}
                    onChange={(event) => handleFormField('category_id', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
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

                <label className="text-sm text-[#4A1F1F]">
                  Diseñadora
                  <select
                    value={form.designer_id}
                    onChange={(event) => handleFormField('designer_id', event.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                  >
                    <option value="">Sin asignar</option>
                    {designers.map((designer) => (
                      <option key={designer.id} value={designer.id}>
                        {designer.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#4A1F1F]">
                  Precio alquiler (interno)
                  <input
                    value={formatCOPInput(form.rental_price)}
                    onChange={(event) => handleFormField('rental_price', parseCOPInput(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    type="text"
                    inputMode="numeric"
                  />
                </label>

                <label className="text-sm text-[#4A1F1F]">
                  Precio venta (interno)
                  <input
                    value={formatCOPInput(form.sale_price)}
                    onChange={(event) => handleFormField('sale_price', parseCOPInput(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    type="text"
                    inputMode="numeric"
                  />
                </label>

                <label className="text-sm text-[#4A1F1F]">
                  Deposito (interno)
                  <input
                    value={formatCOPInput(form.deposit_price)}
                    onChange={(event) => handleFormField('deposit_price', parseCOPInput(event.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    type="text"
                    inputMode="numeric"
                  />
                </label>

                <label className="text-sm text-[#4A1F1F] md:col-span-2">
                  Descripcion
                  <textarea
                    value={form.description}
                    onChange={(event) => handleFormField('description', event.target.value)}
                    className="mt-1 min-h-24 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-[#4A1F1F]">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(event) => handleFormField('is_available', event.target.checked)}
                  />
                  Disponible
                </label>

                <label className="flex items-center gap-2 text-sm text-[#4A1F1F]">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => handleFormField('featured', event.target.checked)}
                  />
                  Destacado
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingCostume}
                  className="rounded-lg bg-[#A8001A] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSavingCostume ? 'Guardando...' : 'Guardar disfraz'}
                </button>
              </div>
            </form>

            <section className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#4A1F1F]">Galeria de imagenes</h2>
                <label className="rounded-lg bg-[#4A1F1F] px-3 py-2 text-xs font-semibold text-white">
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
                <p className="text-sm text-[#6E4B4B]">Guarda primero un disfraz para habilitar su galeria.</p>
              ) : null}

              {isLoadingImages ? <p className="text-sm text-[#6E4B4B]">Cargando imagenes...</p> : null}

              {uploadQueue.length > 0 ? (
                <ul className="mt-3 space-y-1.5 rounded-lg border border-[#E6D0C9] p-3">
                  {uploadQueue.map((item, index) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate text-[#4A1F1F]">
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
                            : 'text-[#6E4B4B]'
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
                  <article key={image.id} className="rounded-xl border border-[#E6D0C9] p-3">
                    <img
                      src={getAdminImageUrl(image.storage_path)}
                      alt={image.alt_text ?? 'Imagen del disfraz'}
                      className="aspect-[4/5] w-full rounded-lg object-cover"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={image.is_primary ? 'font-semibold text-[#A8001A]' : 'text-[#6E4B4B]'}>
                        {image.is_primary ? 'Principal' : `Orden ${image.sort_order + 1}`}
                      </span>
                      <div className="flex gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => handleMoveImage(image.id, 'up')}
                          className="rounded border border-[#D6B8AE] px-2 py-1 disabled:opacity-40"
                        >
                          Subir
                        </button>
                        <button
                          disabled={index === images.length - 1}
                          onClick={() => handleMoveImage(image.id, 'down')}
                          className="rounded border border-[#D6B8AE] px-2 py-1 disabled:opacity-40"
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
                        className="w-full rounded-lg border border-[#D6B8AE] px-2 py-1 text-xs"
                      />
                      <span
                        className={
                          altSaveStatus[image.id] === 'error'
                            ? 'shrink-0 text-[10px] font-semibold text-red-600'
                            : altSaveStatus[image.id] === 'saving'
                            ? 'shrink-0 text-[10px] font-semibold text-[#6E4B4B]'
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
                        className="rounded border border-[#4A1F1F] px-2 py-1 text-xs text-[#4A1F1F]"
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

            <section className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#4A1F1F]">Ficha tecnica del disfraz</h2>
                <button
                  type="button"
                  onClick={handleSaveRelations}
                  disabled={!selectedCostumeId || isSavingRelations}
                  className="rounded-lg bg-[#4A1F1F] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {isSavingRelations ? 'Guardando...' : 'Guardar ficha'}
                </button>
              </div>

              {!selectedCostumeId ? (
                <p className="text-sm text-[#6E4B4B]">Selecciona o crea un disfraz para editar su ficha tecnica.</p>
              ) : (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#4A1F1F]">Detalles visibles</h3>
                    <p className="mt-1 text-xs text-[#6E4B4B]">Un detalle por linea, en el orden deseado.</p>
                    <textarea
                      value={detailsText}
                      onChange={(event) => setDetailsText(event.target.value)}
                      className="mt-2 min-h-36 w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                      placeholder={'Incluye tocado artesanal\nForro interno transpirable\nIdeal para comparsa'}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#4A1F1F]">Telas</h3>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={newFabricName}
                          onChange={(event) => setNewFabricName(event.target.value)}
                          placeholder="Nueva tela"
                          className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCreateFabric}
                          className="rounded-lg border border-[#4A1F1F] px-3 py-2 text-xs font-semibold text-[#4A1F1F]"
                        >
                          Crear
                        </button>
                      </div>
                      <div className="mt-2 grid max-h-32 gap-1 overflow-auto rounded-lg border border-[#EFE1DB] p-2 text-sm">
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
                                className="rounded-full border border-[#A8001A]/30 bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#A8001A]"
                              >
                                {fabric.name}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#4A1F1F]">Accesorios</h3>
                      <div className="mt-2 flex gap-2">
                        <input
                          value={newAccessoryName}
                          onChange={(event) => setNewAccessoryName(event.target.value)}
                          placeholder="Nuevo accesorio"
                          className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleCreateAccessory}
                          className="rounded-lg border border-[#4A1F1F] px-3 py-2 text-xs font-semibold text-[#4A1F1F]"
                        >
                          Crear
                        </button>
                      </div>
                      <div className="mt-2 grid max-h-32 gap-1 overflow-auto rounded-lg border border-[#EFE1DB] p-2 text-sm">
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
                                className="rounded-full border border-[#A8001A]/30 bg-[#FFF4F6] px-2.5 py-1 text-xs font-semibold text-[#A8001A]"
                              >
                                {accessory.name}
                              </span>
                            ))}
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-[#4A1F1F]">Tallas disponibles</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SIZE_OPTIONS.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                              selectedSizes.includes(size)
                                ? 'border-[#A8001A] bg-[#FFF1F4] text-[#A8001A]'
                                : 'border-[#D6B8AE] text-[#6E4B4B]'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
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
              <div className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
                <h2 className="font-serif text-xl text-[#4A1F1F]">Telas</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newFabricNameTab}
                    onChange={(event) => setNewFabricNameTab(event.target.value)}
                    placeholder="Nueva tela"
                    className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFabricTab}
                    className="rounded-lg border border-[#4A1F1F] px-3 py-2 text-xs font-semibold text-[#4A1F1F]"
                  >
                    Crear
                  </button>
                </div>
                <input
                  value={fabricSearchQuery}
                  onChange={(event) => setFabricSearchQuery(event.target.value)}
                  placeholder="Buscar tela..."
                  className="mt-3 w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                />
                <ul className="mt-4 space-y-2">
                  {filteredFabrics.map((fabric) => (
                    <li
                      key={fabric.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#EFE1DB] px-3 py-2"
                    >
                      {editingFabric?.id === fabric.id ? (
                        <input
                          value={editingFabric.name}
                          onChange={(event) => setEditingFabric({ id: fabric.id, name: event.target.value })}
                          className="w-full rounded-lg border border-[#D6B8AE] px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-[#4A1F1F]">{fabric.name}</span>
                      )}
                      <div className="flex shrink-0 gap-1">
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
                            className="rounded border border-[#4A1F1F] px-2 py-1 text-xs text-[#4A1F1F]"
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

              <div className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
                <h2 className="font-serif text-xl text-[#4A1F1F]">Accesorios</h2>
                <div className="mt-3 flex gap-2">
                  <input
                    value={newAccessoryNameTab}
                    onChange={(event) => setNewAccessoryNameTab(event.target.value)}
                    placeholder="Nuevo accesorio"
                    className="w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleCreateAccessoryTab}
                    className="rounded-lg border border-[#4A1F1F] px-3 py-2 text-xs font-semibold text-[#4A1F1F]"
                  >
                    Crear
                  </button>
                </div>
                <input
                  value={accessorySearchQuery}
                  onChange={(event) => setAccessorySearchQuery(event.target.value)}
                  placeholder="Buscar accesorio..."
                  className="mt-3 w-full rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                />
                <ul className="mt-4 space-y-2">
                  {filteredAccessories.map((accessory) => (
                    <li
                      key={accessory.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-[#EFE1DB] px-3 py-2"
                    >
                      {editingAccessory?.id === accessory.id ? (
                        <input
                          value={editingAccessory.name}
                          onChange={(event) =>
                            setEditingAccessory({ id: accessory.id, name: event.target.value })
                          }
                          className="w-full rounded-lg border border-[#D6B8AE] px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="text-sm text-[#4A1F1F]">{accessory.name}</span>
                      )}
                      <div className="flex shrink-0 gap-1">
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
                            className="rounded border border-[#4A1F1F] px-2 py-1 text-xs text-[#4A1F1F]"
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
            <Suspense fallback={<p className="text-sm text-[#6E4B4B]">Cargando Insights...</p>}>
              <InsightsSection onNavigateToCostume={handleNavigateToCostumeFromInsights} />
            </Suspense>
          ) : null}

          {activeSection === 'configuracion' ? (
            <section className="rounded-2xl border border-[#E6D0C9] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-[#4A1F1F]">Configuracion del sitio</h2>
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
                  <h3 className="text-sm font-semibold text-[#4A1F1F]">Estadisticas</h3>
                  <label className="block text-sm text-[#4A1F1F]">
                    Anos de tradicion
                    <input
                      value={siteStats.years_of_tradition}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, years_of_tradition: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Carnavales vividos
                    <input
                      value={siteStats.carnivals_lived}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, carnivals_lived: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Disfraces alquilados
                    <input
                      value={siteStats.costumes_rented}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, costumes_rented: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Corazones felices
                    <input
                      value={siteStats.happy_hearts}
                      onChange={(event) =>
                        setSiteStats((prev) => ({ ...prev, happy_hearts: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-[#4A1F1F]">Contacto</h3>
                  <label className="block text-sm text-[#4A1F1F]">
                    Direccion interna
                    <input
                      value={contactInfo.address}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, address: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Ciudad
                    <input
                      value={contactInfo.city}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, city: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Telefono
                    <input
                      value={contactInfo.phone}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, phone: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    WhatsApp
                    <input
                      value={contactInfo.whatsapp}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, whatsapp: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                  <label className="block text-sm text-[#4A1F1F]">
                    Email
                    <input
                      value={contactInfo.email}
                      onChange={(event) =>
                        setContactInfo((prev) => ({ ...prev, email: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#D6B8AE] px-3 py-2"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#4A1F1F]">Horarios de atencion</h3>
                  <button
                    type="button"
                    onClick={handleAddWorkingHour}
                    className="rounded-lg border border-[#4A1F1F] px-3 py-1 text-xs font-semibold text-[#4A1F1F]"
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
                        className="rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                      />
                      <input
                        value={row.hours}
                        onChange={(event) => handleWorkingHourField(index, 'hours', event.target.value)}
                        placeholder="Horario"
                        className="rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
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
                <h3 className="text-sm font-semibold text-[#4A1F1F]">Assets institucionales</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    value={newAssetKey}
                    onChange={(event) => setNewAssetKey(event.target.value)}
                    className="w-48 rounded-lg border border-[#D6B8AE] px-3 py-2 text-sm"
                    placeholder="key del asset"
                  />
                  <label className="rounded-lg bg-[#4A1F1F] px-3 py-2 text-xs font-semibold text-white">
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
                    <article key={asset.key} className="rounded-xl border border-[#E6D0C9] p-3">
                      <p className="text-xs font-semibold text-[#4A1F1F]">{asset.key}</p>
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
    </section>
  );
}
