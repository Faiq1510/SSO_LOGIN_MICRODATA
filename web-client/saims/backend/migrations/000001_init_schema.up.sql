--
-- PostgreSQL database dump
--

\restrict 7G6TomccnMaaveOirhudcAZTSpKUFvG8g860D1hKgyYHU18898uLpPjndrUkgOS

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asset_deletion_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_deletion_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id character varying(50) NOT NULL,
    requested_by uuid NOT NULL,
    approver_id uuid,
    reason text NOT NULL,
    status text DEFAULT 'Pending'::text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.asset_deletion_requests OWNER TO postgres;

--
-- Name: asset_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.asset_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    asset_id character varying(50) NOT NULL,
    object_key text NOT NULL,
    bucket_name text DEFAULT 'inventory-assets'::text NOT NULL,
    file_name text,
    mime_type text,
    file_size bigint,
    is_primary boolean DEFAULT false NOT NULL,
    sort_order bigint DEFAULT 0 NOT NULL,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone
);


ALTER TABLE public.asset_images OWNER TO postgres;

--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id character varying(50) NOT NULL,
    name text NOT NULL,
    category text NOT NULL,
    location text NOT NULL,
    status text DEFAULT 'Tersedia'::text NOT NULL,
    condition text DEFAULT 'Baik'::text NOT NULL,
    purchase_date text,
    serial_number text,
    qr_code text,
    description text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    deleted_at timestamp with time zone
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    action character varying(50) NOT NULL,
    entity_name character varying(100) NOT NULL,
    entity_id character varying(100) NOT NULL,
    old_values text,
    new_values text,
    changed_by character varying(255) NOT NULL,
    created_at timestamp with time zone,
    old_payload jsonb,
    new_payload jsonb
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: borrowings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.borrowings (
    id character varying(50) NOT NULL,
    user_id uuid NOT NULL,
    borrower_name text,
    asset_id character varying(50) NOT NULL,
    asset_name text,
    start_date text,
    end_date text,
    purpose text,
    status text DEFAULT 'Pending_Supervisor'::text NOT NULL,
    rejection_reason text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE public.borrowings OWNER TO postgres;

--
-- Name: jwt_blacklists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jwt_blacklists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.jwt_blacklists OWNER TO postgres;

--
-- Name: maintenances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.maintenances (
    id character varying(50) NOT NULL,
    asset_id character varying(50) NOT NULL,
    asset_name text,
    technician_id uuid,
    technician_name text,
    type text DEFAULT 'Rutin'::text NOT NULL,
    status text DEFAULT 'Dijadwalkan'::text NOT NULL,
    scheduled_date text,
    completed_date text,
    cost numeric,
    notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_edited boolean DEFAULT false,
    actual_start_date text,
    estimated_cost numeric,
    actual_cost numeric
);


ALTER TABLE public.maintenances OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type character varying(50),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    role text DEFAULT 'Staff'::text,
    department text,
    id_karyawan character varying(50),
    last_login timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    otp_code character varying(6),
    otp_expiry timestamp with time zone,
    is_verified boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: asset_deletion_requests asset_deletion_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_requests
    ADD CONSTRAINT asset_deletion_requests_pkey PRIMARY KEY (id);


--
-- Name: asset_images asset_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_images
    ADD CONSTRAINT asset_images_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: borrowings borrowings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.borrowings
    ADD CONSTRAINT borrowings_pkey PRIMARY KEY (id);


--
-- Name: jwt_blacklists jwt_blacklists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jwt_blacklists
    ADD CONSTRAINT jwt_blacklists_pkey PRIMARY KEY (id);


--
-- Name: maintenances maintenances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.maintenances
    ADD CONSTRAINT maintenances_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: assets uni_assets_qr_code; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT uni_assets_qr_code UNIQUE (qr_code);


--
-- Name: users uni_users_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uni_users_email UNIQUE (email);


--
-- Name: asset_images uq_asset_images_bucket_object; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_images
    ADD CONSTRAINT uq_asset_images_bucket_object UNIQUE (bucket_name, object_key);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_asset_images_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_images_asset_id ON public.asset_images USING btree (asset_id);


--
-- Name: idx_asset_images_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_asset_images_deleted_at ON public.asset_images USING btree (deleted_at);


--
-- Name: idx_assets_deleted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_assets_deleted_at ON public.assets USING btree (deleted_at);


--
-- Name: idx_borrowings_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_asset_id ON public.borrowings USING btree (asset_id);


--
-- Name: idx_borrowings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_borrowings_status ON public.borrowings USING btree (status);


--
-- Name: idx_jwt_blacklists_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_jwt_blacklists_token ON public.jwt_blacklists USING btree (token);


--
-- Name: idx_maintenances_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenances_asset_id ON public.maintenances USING btree (asset_id);


--
-- Name: idx_maintenances_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_maintenances_status ON public.maintenances USING btree (status);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: uq_asset_images_one_primary; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX uq_asset_images_one_primary ON public.asset_images USING btree (asset_id) WHERE (is_primary = true);


--
-- Name: audit_logs prevent_audit_delete; Type: RULE; Schema: public; Owner: postgres
--

CREATE RULE prevent_audit_delete AS
    ON DELETE TO public.audit_logs DO INSTEAD NOTHING;


--
-- Name: audit_logs prevent_audit_update; Type: RULE; Schema: public; Owner: postgres
--

CREATE RULE prevent_audit_update AS
    ON UPDATE TO public.audit_logs DO INSTEAD NOTHING;


--
-- Name: asset_deletion_requests fk_asset_deletion_requests_approver; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_requests
    ADD CONSTRAINT fk_asset_deletion_requests_approver FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: asset_deletion_requests fk_asset_deletion_requests_asset; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_requests
    ADD CONSTRAINT fk_asset_deletion_requests_asset FOREIGN KEY (asset_id) REFERENCES public.assets(id);


--
-- Name: asset_deletion_requests fk_asset_deletion_requests_requester; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_deletion_requests
    ADD CONSTRAINT fk_asset_deletion_requests_requester FOREIGN KEY (requested_by) REFERENCES public.users(id);


--
-- Name: asset_images fk_asset_images_asset; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_images
    ADD CONSTRAINT fk_asset_images_asset FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: asset_images fk_asset_images_uploader; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_images
    ADD CONSTRAINT fk_asset_images_uploader FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: asset_images fk_assets_images; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.asset_images
    ADD CONSTRAINT fk_assets_images FOREIGN KEY (asset_id) REFERENCES public.assets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict 7G6TomccnMaaveOirhudcAZTSpKUFvG8g860D1hKgyYHU18898uLpPjndrUkgOS

