--
-- PostgreSQL database dump
--

\restrict EOjchygOMA2oO3msM2ifY9Dcc9G9eHIa9VR7Tdj5dIjYxbbDFM9gi2qKRb9Rnde

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
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
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.actividad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nivel_id uuid NOT NULL,
    nombre character varying(100) NOT NULL,
    descripcion character varying(255),
    tipo character varying(50) NOT NULL,
    orden integer NOT NULL,
    icono_url character varying(255)
);


--
-- Name: cuenta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cuenta (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    correo character varying(150) NOT NULL,
    contrasena character varying(255) NOT NULL,
    rol character varying(15) NOT NULL,
    token_activacion character varying(255),
    cuenta_activa boolean DEFAULT false NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: insignia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.insignia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(50) NOT NULL,
    descripcion character varying(255) NOT NULL,
    icono_url character varying(255) NOT NULL,
    es_oculta boolean DEFAULT false NOT NULL,
    condicion_tipo character varying(50) NOT NULL,
    condicion_valor integer NOT NULL
);


--
-- Name: item_actividad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_actividad (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    actividad_id uuid NOT NULL,
    orden integer NOT NULL,
    contenido jsonb NOT NULL,
    respuesta_correcta character varying(255),
    puntos_base integer DEFAULT 10 NOT NULL
);


--
-- Name: nivel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nivel (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nombre character varying(20) NOT NULL,
    descripcion character varying(255),
    orden integer NOT NULL
);


--
-- Name: perfil_insignia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perfil_insignia (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    perfil_id uuid NOT NULL,
    insignia_id uuid NOT NULL,
    fecha_obtenida timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: perfil_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.perfil_usuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cuenta_id uuid NOT NULL,
    nombre character varying(30) NOT NULL,
    foto_perfil character varying(255),
    tipo_perfil character varying(15) NOT NULL,
    racha_actual integer DEFAULT 0 NOT NULL,
    ultima_conexion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: progreso_usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.progreso_usuario (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    perfil_id uuid NOT NULL,
    actividad_id uuid NOT NULL,
    completado boolean DEFAULT false NOT NULL,
    mejor_puntaje integer DEFAULT 0 NOT NULL,
    intentos integer DEFAULT 0 NOT NULL,
    ultima_vez timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: actividad actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividad
    ADD CONSTRAINT actividad_pkey PRIMARY KEY (id);


--
-- Name: cuenta cuenta_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_correo_key UNIQUE (correo);


--
-- Name: cuenta cuenta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cuenta
    ADD CONSTRAINT cuenta_pkey PRIMARY KEY (id);


--
-- Name: insignia insignia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.insignia
    ADD CONSTRAINT insignia_pkey PRIMARY KEY (id);


--
-- Name: item_actividad item_actividad_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_actividad
    ADD CONSTRAINT item_actividad_pkey PRIMARY KEY (id);


--
-- Name: nivel nivel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nivel
    ADD CONSTRAINT nivel_pkey PRIMARY KEY (id);


--
-- Name: perfil_insignia perfil_insignia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfil_insignia
    ADD CONSTRAINT perfil_insignia_pkey PRIMARY KEY (id);


--
-- Name: perfil_usuario perfil_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfil_usuario
    ADD CONSTRAINT perfil_usuario_pkey PRIMARY KEY (id);


--
-- Name: progreso_usuario progreso_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_usuario
    ADD CONSTRAINT progreso_usuario_pkey PRIMARY KEY (id);


--
-- Name: actividad actividad_nivel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.actividad
    ADD CONSTRAINT actividad_nivel_id_fkey FOREIGN KEY (nivel_id) REFERENCES public.nivel(id);


--
-- Name: item_actividad item_actividad_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_actividad
    ADD CONSTRAINT item_actividad_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividad(id);


--
-- Name: perfil_insignia perfil_insignia_insignia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfil_insignia
    ADD CONSTRAINT perfil_insignia_insignia_id_fkey FOREIGN KEY (insignia_id) REFERENCES public.insignia(id);


--
-- Name: perfil_insignia perfil_insignia_perfil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfil_insignia
    ADD CONSTRAINT perfil_insignia_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfil_usuario(id);


--
-- Name: perfil_usuario perfil_usuario_cuenta_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.perfil_usuario
    ADD CONSTRAINT perfil_usuario_cuenta_id_fkey FOREIGN KEY (cuenta_id) REFERENCES public.cuenta(id);


--
-- Name: progreso_usuario progreso_usuario_actividad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_usuario
    ADD CONSTRAINT progreso_usuario_actividad_id_fkey FOREIGN KEY (actividad_id) REFERENCES public.actividad(id);


--
-- Name: progreso_usuario progreso_usuario_perfil_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.progreso_usuario
    ADD CONSTRAINT progreso_usuario_perfil_id_fkey FOREIGN KEY (perfil_id) REFERENCES public.perfil_usuario(id);


--
-- PostgreSQL database dump complete
--

\unrestrict EOjchygOMA2oO3msM2ifY9Dcc9G9eHIa9VR7Tdj5dIjYxbbDFM9gi2qKRb9Rnde

