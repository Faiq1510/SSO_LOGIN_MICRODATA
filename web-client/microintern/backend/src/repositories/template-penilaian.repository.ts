import { db, DbClient } from "../config/database";

export interface TemplatePenilaian {
  id: string;
  nama_template: string;
  institusi: string | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
  kriteria?: TemplateKriteria[];
}

export interface TemplateKriteria {
  id: string;
  template_id: string;
  nama_kriteria: string;
  urutan: number;
  created_at: Date;
}

export const findAllTemplatesWithKriteria = async (dbClient: DbClient = db): Promise<TemplatePenilaian[]> => {
  const templatesRes = await dbClient.query("SELECT * FROM template_penilaian ORDER BY is_default DESC, nama_template ASC");
  const templates: TemplatePenilaian[] = templatesRes.rows;

  for (const t of templates) {
    const kriteriaRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1 ORDER BY urutan ASC, created_at ASC", [t.id]);
    t.kriteria = kriteriaRes.rows;
  }

  return templates;
};

export const findTemplateById = async (id: string, dbClient: DbClient = db): Promise<TemplatePenilaian | null> => {
  const result = await dbClient.query("SELECT * FROM template_penilaian WHERE id = $1", [id]);
  const template: TemplatePenilaian | null = result.rows[0] || null;

  if (template) {
    const kriteriaRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1 ORDER BY urutan ASC, created_at ASC", [template.id]);
    template.kriteria = kriteriaRes.rows;
  }

  return template;
};

export const findTemplateByInstitusi = async (institusi: string, dbClient: DbClient = db): Promise<TemplatePenilaian | null> => {
  const result = await dbClient.query("SELECT * FROM template_penilaian WHERE LOWER(institusi) = LOWER($1) LIMIT 1", [institusi]);
  const template: TemplatePenilaian | null = result.rows[0] || null;

  if (template) {
    const kriteriaRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1 ORDER BY urutan ASC, created_at ASC", [template.id]);
    template.kriteria = kriteriaRes.rows;
  }

  return template;
};

export const findDefaultTemplate = async (dbClient: DbClient = db): Promise<TemplatePenilaian | null> => {
  const result = await dbClient.query("SELECT * FROM template_penilaian WHERE is_default = TRUE LIMIT 1");
  const template: TemplatePenilaian | null = result.rows[0] || null;

  if (template) {
    const kriteriaRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1 ORDER BY urutan ASC, created_at ASC", [template.id]);
    template.kriteria = kriteriaRes.rows;
  }

  return template;
};

export const createTemplate = async (data: { nama_template: string; institusi?: string | null; is_default?: boolean }, dbClient: DbClient = db): Promise<TemplatePenilaian> => {
  const institusi = data.institusi || null;
  const isDefault = data.is_default || false;

  const result = await dbClient.query(
    `INSERT INTO template_penilaian (nama_template, institusi, is_default)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [data.nama_template, institusi, isDefault]
  );
  return result.rows[0];
};

export const updateTemplate = async (
  id: string,
  data: {
    nama_template?: string;
    institusi?: string | null;
  },
  dbClient: DbClient = db
): Promise<TemplatePenilaian | null> => {
  const existing = await findTemplateById(id, dbClient);
  if (!existing) return null;

  const namaTemplate = data.nama_template !== undefined ? data.nama_template : existing.nama_template;
  const institusi = data.institusi !== undefined ? data.institusi : existing.institusi;

  const result = await dbClient.query(
    `UPDATE template_penilaian
     SET nama_template = $1, institusi = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [namaTemplate, institusi, id]
  );
  return result.rows[0] || null;
};

export const deleteTemplate = async (id: string, dbClient: DbClient = db): Promise<boolean> => {
  const result = await dbClient.query("DELETE FROM template_penilaian WHERE id = $1 AND is_default = FALSE", [id]);
  return (result.rowCount ?? 0) > 0;
};

export const replaceKriteriaForTemplate = async (templateId: string, kriteriaList: string[], dbClient: DbClient = db): Promise<void> => {
  const existingRes = await dbClient.query("SELECT * FROM template_kriteria WHERE template_id = $1", [templateId]);
  const existingKriteria: TemplateKriteria[] = existingRes.rows;

  const handledIds = new Set<string>();

  for (let i = 0; i < kriteriaList.length; i++) {
    const name = kriteriaList[i].trim();
    const existing = existingKriteria.find((k) => !handledIds.has(k.id) && k.nama_kriteria.trim().toLowerCase() === name.toLowerCase());

    if (existing) {
      handledIds.add(existing.id);
      await dbClient.query("UPDATE template_kriteria SET nama_kriteria = $1, urutan = $2 WHERE id = $3", [name, i + 1, existing.id]);
    } else {
      await dbClient.query("INSERT INTO template_kriteria (template_id, nama_kriteria, urutan) VALUES ($1, $2, $3)", [templateId, name, i + 1]);
    }
  }

  for (const k of existingKriteria) {
    if (!handledIds.has(k.id)) {
      await dbClient.query("DELETE FROM template_kriteria WHERE id = $1", [k.id]);
    }
  }
};
