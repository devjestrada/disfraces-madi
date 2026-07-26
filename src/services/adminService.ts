import { getPublicImageUrl, supabaseAdmin } from '../lib/supabase';
import type {
  AdminCategory,
  AdminCostume,
  AdminCostumeImage,
  AdminCostumeRelations,
  AdminCostumePayload,
  AdminDesigner,
  AdminNamedOption,
  AdminSiteAsset,
  AdminSiteStats,
  AdminContactInfo,
  AdminWorkingHour,
  CostumeSize,
} from '../types';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function toAdminCostume(record: any): AdminCostume {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    category_id: record.category_id,
    category_name: record.categories?.name,
    description: record.description,
    designer_id: record.designer_id,
    designer_name: record.designers?.name ?? null,
    rental_price: record.rental_price !== null && record.rental_price !== undefined ? Number(record.rental_price) : null,
    sale_price: record.sale_price !== null ? Number(record.sale_price) : null,
    deposit_price: record.deposit_price !== null && record.deposit_price !== undefined ? Number(record.deposit_price) : null,
    is_available: Boolean(record.is_available),
    featured: Boolean(record.featured),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function toImageRecord(record: any): AdminCostumeImage {
  return {
    id: record.id,
    costume_id: record.costume_id,
    storage_path: record.storage_path,
    is_primary: Boolean(record.is_primary),
    sort_order: Number(record.sort_order ?? 0),
    alt_text: record.alt_text ?? null,
  };
}

export async function fetchAdminLookups() {
  const [{ data: categories, error: categoriesError }, { data: designers, error: designersError }] =
    await Promise.all([
      supabaseAdmin.from('categories').select('id, name, slug, sort_order').order('sort_order', {
        ascending: true,
      }),
      supabaseAdmin.from('designers').select('id, name').order('name', { ascending: true }),
    ]);

  if (categoriesError) {
    throw new Error(categoriesError.message);
  }

  if (designersError) {
    throw new Error(designersError.message);
  }

  return {
    categories: (categories ?? []) as AdminCategory[],
    designers: (designers ?? []) as AdminDesigner[],
  };
}

export async function fetchAdminCostumes() {
  const { data, error } = await supabaseAdmin
    .from('costumes')
    .select(
      'id, slug, name, category_id, description, designer_id, rental_price, sale_price, deposit_price, is_available, featured, created_at, updated_at, categories(name), designers(name)'
    )
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const costumes = (data ?? []).map(toAdminCostume);

  const { data: primaryImages, error: imagesError } = await supabaseAdmin
    .from('costume_images')
    .select('costume_id, storage_path')
    .eq('is_primary', true);

  if (imagesError) {
    throw new Error(imagesError.message);
  }

  const primaryImageByCostumeId = new Map(
    (primaryImages ?? []).map((row: any) => [row.costume_id, row.storage_path as string])
  );

  return costumes.map((costume) => ({
    ...costume,
    primary_image: primaryImageByCostumeId.get(costume.id) ?? null,
  }));
}

export async function createCostume(payload: AdminCostumePayload) {
  const { data, error } = await supabaseAdmin
    .from('costumes')
    .insert(payload)
    .select('id, slug, name, category_id, description, designer_id, rental_price, sale_price, deposit_price, is_available, featured, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAdminCostume(data);
}

export async function updateCostume(costumeId: string, payload: AdminCostumePayload) {
  const { data, error } = await supabaseAdmin
    .from('costumes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', costumeId)
    .select('id, slug, name, category_id, description, designer_id, rental_price, sale_price, deposit_price, is_available, featured, created_at, updated_at')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return toAdminCostume(data);
}

export async function deleteCostume(costumeId: string) {
  const { error } = await supabaseAdmin.from('costumes').delete().eq('id', costumeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function toggleCostumeFlag(
  costumeId: string,
  field: 'is_available' | 'featured',
  value: boolean
) {
  const { error } = await supabaseAdmin
    .from('costumes')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', costumeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCostumeImages(costumeId: string) {
  const { data, error } = await supabaseAdmin
    .from('costume_images')
    .select('id, costume_id, storage_path, is_primary, sort_order, alt_text')
    .eq('costume_id', costumeId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(toImageRecord);
}

export async function setPrimaryCostumeImage(costumeId: string, imageId: string) {
  const { error: clearError } = await supabaseAdmin
    .from('costume_images')
    .update({ is_primary: false })
    .eq('costume_id', costumeId)
    .neq('id', imageId);

  if (clearError) {
    throw new Error(clearError.message);
  }

  const { error } = await supabaseAdmin
    .from('costume_images')
    .update({ is_primary: true })
    .eq('id', imageId)
    .eq('costume_id', costumeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateCostumeImageAltText(imageId: string, altText: string) {
  const { error } = await supabaseAdmin
    .from('costume_images')
    .update({ alt_text: altText.trim() || null })
    .eq('id', imageId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function reorderCostumeImages(
  costumeId: string,
  imageIdsInOrder: string[]
) {
  const operations = imageIdsInOrder.map((imageId, index) =>
    supabaseAdmin
      .from('costume_images')
      .update({ sort_order: index })
      .eq('id', imageId)
      .eq('costume_id', costumeId)
  );

  const results = await Promise.all(operations);
  const failed = results.find((result) => result.error);
  if (failed?.error) {
    throw new Error(failed.error.message);
  }
}

function getFileExtension(file: File) {
  const fromType = file.type.split('/')[1];
  if (fromType) {
    return fromType.toLowerCase();
  }

  const fromName = file.name.split('.').pop();
  return (fromName ?? 'jpg').toLowerCase();
}

async function getNextImageOrder(costumeId: string) {
  const { data, error } = await supabaseAdmin
    .from('costume_images')
    .select('sort_order')
    .eq('costume_id', costumeId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return typeof data?.sort_order === 'number' ? data.sort_order + 1 : 0;
}

export async function uploadCostumeImage(
  costumeId: string,
  file: File,
  options?: { makePrimary?: boolean; altText?: string }
) {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WEBP.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Archivo supera 5MB. Reduce el tamano antes de subir.');
  }

  const ext = getFileExtension(file);
  const storagePath = `costumes/${costumeId}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('costume-images')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const nextOrder = await getNextImageOrder(costumeId);
  const { data, error } = await supabaseAdmin
    .from('costume_images')
    .insert({
      costume_id: costumeId,
      storage_path: storagePath,
      sort_order: nextOrder,
      is_primary: false,
      alt_text: options?.altText?.trim() || null,
    })
    .select('id, costume_id, storage_path, is_primary, sort_order, alt_text')
    .single();

  if (error) {
    await supabaseAdmin.storage.from('costume-images').remove([storagePath]);
    throw new Error(error.message);
  }

  if (options?.makePrimary) {
    await setPrimaryCostumeImage(costumeId, data.id);
    data.is_primary = true;
  }

  return toImageRecord(data);
}

export async function deleteCostumeImage(image: AdminCostumeImage) {
  const { error: storageError } = await supabaseAdmin.storage
    .from('costume-images')
    .remove([image.storage_path]);

  if (storageError) {
    throw new Error(storageError.message);
  }

  const { error: deleteError } = await supabaseAdmin
    .from('costume_images')
    .delete()
    .eq('id', image.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (!image.is_primary) {
    return;
  }

  const remaining = await fetchCostumeImages(image.costume_id);
  if (remaining.length > 0) {
    await setPrimaryCostumeImage(image.costume_id, remaining[0].id);
  }
}

export function getAdminImageUrl(storagePath: string) {
  return getPublicImageUrl(storagePath, 'costume-images');
}

export async function fetchRelationLookups() {
  const [{ data: fabrics, error: fabricsError }, { data: accessories, error: accessoriesError }] =
    await Promise.all([
      supabaseAdmin.from('fabrics').select('id, name').order('name', { ascending: true }),
      supabaseAdmin.from('accessories').select('id, name').order('name', { ascending: true }),
    ]);

  if (fabricsError) {
    throw new Error(fabricsError.message);
  }

  if (accessoriesError) {
    throw new Error(accessoriesError.message);
  }

  return {
    fabrics: (fabrics ?? []) as AdminNamedOption[],
    accessories: (accessories ?? []) as AdminNamedOption[],
  };
}

function groupCostumeNamesById(rows: any[] | null, idField: string): Map<string, string[]> {
  const usage = new Map<string, string[]>();
  for (const row of rows ?? []) {
    const related = Array.isArray(row.costumes) ? row.costumes[0] : row.costumes;
    const name = related?.name;
    if (!name) {
      continue;
    }
    const list = usage.get(row[idField]) ?? [];
    list.push(name);
    usage.set(row[idField], list);
  }
  return usage;
}

export async function fetchFabricUsage(): Promise<Map<string, string[]>> {
  const { data, error } = await supabaseAdmin
    .from('costume_fabrics')
    .select('fabric_id, costumes(name)');

  if (error) {
    throw new Error(error.message);
  }

  return groupCostumeNamesById(data, 'fabric_id');
}

export async function fetchAccessoryUsage(): Promise<Map<string, string[]>> {
  const { data, error } = await supabaseAdmin
    .from('costume_accessories')
    .select('accessory_id, costumes(name)');

  if (error) {
    throw new Error(error.message);
  }

  return groupCostumeNamesById(data, 'accessory_id');
}

export async function createFabric(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nombre de tela requerido.');
  }

  const { data, error } = await supabaseAdmin
    .from('fabrics')
    .insert({ name: trimmed })
    .select('id, name')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminNamedOption;
}

export async function createAccessory(name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nombre de accesorio requerido.');
  }

  const { data, error } = await supabaseAdmin
    .from('accessories')
    .insert({ name: trimmed })
    .select('id, name')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminNamedOption;
}

export async function updateFabric(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nombre de tela requerido.');
  }

  const { data, error } = await supabaseAdmin
    .from('fabrics')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, name')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminNamedOption;
}

export async function deleteFabric(id: string) {
  const { count, error: countError } = await supabaseAdmin
    .from('costume_fabrics')
    .select('costume_id', { count: 'exact', head: true })
    .eq('fabric_id', id);

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    throw new Error(`No se puede eliminar: ${count} disfraz(ces) usan esta tela.`);
  }

  const { error } = await supabaseAdmin.from('fabrics').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function updateAccessory(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Nombre de accesorio requerido.');
  }

  const { data, error } = await supabaseAdmin
    .from('accessories')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, name')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AdminNamedOption;
}

export async function deleteAccessory(id: string) {
  const { count, error: countError } = await supabaseAdmin
    .from('costume_accessories')
    .select('costume_id', { count: 'exact', head: true })
    .eq('accessory_id', id);

  if (countError) {
    throw new Error(countError.message);
  }

  if (count && count > 0) {
    throw new Error(`No se puede eliminar: ${count} disfraz(ces) usan este accesorio.`);
  }

  const { error } = await supabaseAdmin.from('accessories').delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchCostumeRelations(costumeId: string): Promise<AdminCostumeRelations> {
  const [detailsResult, fabricsResult, accessoriesResult, sizesResult] = await Promise.all([
    supabaseAdmin
      .from('costume_details')
      .select('id, detail, sort_order')
      .eq('costume_id', costumeId)
      .order('sort_order', { ascending: true }),
    supabaseAdmin
      .from('costume_fabrics')
      .select('fabric_id')
      .eq('costume_id', costumeId),
    supabaseAdmin
      .from('costume_accessories')
      .select('accessory_id')
      .eq('costume_id', costumeId),
    supabaseAdmin.from('costume_sizes').select('size').eq('costume_id', costumeId),
  ]);

  if (detailsResult.error) {
    throw new Error(detailsResult.error.message);
  }
  if (fabricsResult.error) {
    throw new Error(fabricsResult.error.message);
  }
  if (accessoriesResult.error) {
    throw new Error(accessoriesResult.error.message);
  }
  if (sizesResult.error) {
    throw new Error(sizesResult.error.message);
  }

  return {
    details: (detailsResult.data ?? []) as AdminCostumeRelations['details'],
    fabricIds: (fabricsResult.data ?? []).map((row: any) => row.fabric_id),
    accessoryIds: (accessoriesResult.data ?? []).map((row: any) => row.accessory_id),
    sizes: (sizesResult.data ?? []).map((row: any) => row.size),
  };
}

export async function saveCostumeRelations(
  costumeId: string,
  payload: {
    details: string[];
    fabricIds: string[];
    accessoryIds: string[];
    sizes: CostumeSize[];
  }
) {
  const detailsClean = payload.details.map((item) => item.trim()).filter(Boolean);

  const [detailsDelete, fabricsDelete, accessoriesDelete, sizesDelete] = await Promise.all([
    supabaseAdmin.from('costume_details').delete().eq('costume_id', costumeId),
    supabaseAdmin.from('costume_fabrics').delete().eq('costume_id', costumeId),
    supabaseAdmin.from('costume_accessories').delete().eq('costume_id', costumeId),
    supabaseAdmin.from('costume_sizes').delete().eq('costume_id', costumeId),
  ]);

  for (const result of [detailsDelete, fabricsDelete, accessoriesDelete, sizesDelete]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  if (detailsClean.length > 0) {
    const { error } = await supabaseAdmin.from('costume_details').insert(
      detailsClean.map((detail, index) => ({
        costume_id: costumeId,
        detail,
        sort_order: index,
      }))
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  if (payload.fabricIds.length > 0) {
    const { error } = await supabaseAdmin.from('costume_fabrics').insert(
      payload.fabricIds.map((fabricId) => ({
        costume_id: costumeId,
        fabric_id: fabricId,
      }))
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  if (payload.accessoryIds.length > 0) {
    const { error } = await supabaseAdmin.from('costume_accessories').insert(
      payload.accessoryIds.map((accessoryId) => ({
        costume_id: costumeId,
        accessory_id: accessoryId,
      }))
    );
    if (error) {
      throw new Error(error.message);
    }
  }

  if (payload.sizes.length > 0) {
    const { error } = await supabaseAdmin.from('costume_sizes').insert(
      payload.sizes.map((size) => ({
        costume_id: costumeId,
        size,
      }))
    );
    if (error) {
      throw new Error(error.message);
    }
  }
}

export async function fetchSiteConfig() {
  const [statsResult, contactResult, hoursResult, assetsResult] = await Promise.all([
    supabaseAdmin.from('site_stats').select('*').maybeSingle(),
    supabaseAdmin.from('contact_info').select('*').maybeSingle(),
    supabaseAdmin.from('working_hours').select('*').order('sort_order', { ascending: true }),
    supabaseAdmin.from('site_assets').select('*').order('key', { ascending: true }),
  ]);

  for (const result of [statsResult, contactResult, hoursResult, assetsResult]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    stats: {
      years_of_tradition: statsResult.data?.years_of_tradition ?? '',
      carnivals_lived: statsResult.data?.carnivals_lived ?? '',
      costumes_rented: statsResult.data?.costumes_rented ?? '',
      happy_hearts: statsResult.data?.happy_hearts ?? '',
    } as AdminSiteStats,
    contact: {
      address: contactResult.data?.address ?? '',
      city: contactResult.data?.city ?? '',
      phone: contactResult.data?.phone ?? '',
      whatsapp: contactResult.data?.whatsapp ?? '',
      email: contactResult.data?.email ?? '',
    } as AdminContactInfo,
    workingHours: (hoursResult.data ?? []) as AdminWorkingHour[],
    siteAssets: (assetsResult.data ?? []) as AdminSiteAsset[],
  };
}

export async function saveSiteStats(payload: AdminSiteStats) {
  const { error } = await supabaseAdmin.from('site_stats').upsert(
    {
      id: true,
      years_of_tradition: payload.years_of_tradition,
      carnivals_lived: payload.carnivals_lived,
      costumes_rented: payload.costumes_rented,
      happy_hearts: payload.happy_hearts,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveContactInfo(payload: AdminContactInfo) {
  const { error } = await supabaseAdmin.from('contact_info').upsert(
    {
      id: true,
      address: payload.address,
      city: payload.city,
      phone: payload.phone,
      whatsapp: payload.whatsapp,
      email: payload.email,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveWorkingHours(hours: Array<{ days: string; hours: string }>) {
  const cleaned = hours
    .map((item) => ({ days: item.days.trim(), hours: item.hours.trim() }))
    .filter((item) => item.days && item.hours);

  const { error: deleteError } = await supabaseAdmin
    .from('working_hours')
    .delete()
    .not('id', 'is', null);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (cleaned.length === 0) {
    return;
  }

  const { error } = await supabaseAdmin.from('working_hours').insert(
    cleaned.map((item, index) => ({
      days: item.days,
      hours: item.hours,
      sort_order: index,
    }))
  );

  if (error) {
    throw new Error(error.message);
  }
}

const ALLOWED_SITE_ASSET_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
]);

export async function uploadSiteAsset(key: string, file: File) {
  if (!ALLOWED_SITE_ASSET_MIME_TYPES.has(file.type)) {
    throw new Error('Formato no permitido para asset. Usa JPG, PNG, WEBP o SVG.');
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('El asset supera 5MB.');
  }

  const ext = getFileExtension(file);
  const storagePath = `site-assets/${key}/${crypto.randomUUID()}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from('site-assets')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: current } = await supabaseAdmin
    .from('site_assets')
    .select('storage_path')
    .eq('key', key)
    .maybeSingle();

  const { error: upsertError } = await supabaseAdmin
    .from('site_assets')
    .upsert({ key, storage_path: storagePath }, { onConflict: 'key' });

  if (upsertError) {
    await supabaseAdmin.storage.from('site-assets').remove([storagePath]);
    throw new Error(upsertError.message);
  }

  if (current?.storage_path) {
    await supabaseAdmin.storage.from('site-assets').remove([current.storage_path]);
  }
}

export function getSiteAssetUrl(storagePath: string) {
  return getPublicImageUrl(storagePath, 'site-assets');
}
