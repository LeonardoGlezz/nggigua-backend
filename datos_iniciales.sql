--
-- PostgreSQL database dump
--

\restrict wXCvEIsFCQoHfhGS6jt0fTv2gdUMDUz3lcY58bE8OWzbiFLrdjC2fipqnAWJLTA

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
-- Data for Name: nivel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.nivel (id, nombre, descripcion, orden) FROM stdin;
2fa07d68-5133-4003-ac7c-bde173fcf253	Básico	Nivel introductorio al idioma Nggigua	1
18283b5b-642c-4404-b0f5-0cf5a212e4d6	Intermedio	Nivel de práctica y conversación básica	2
a8034194-6836-41ff-8d0d-f812a222bc80	Avanzado	Nivel de fluidez y conversación compleja	3
\.


--
-- Data for Name: actividad; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.actividad (id, nivel_id, nombre, descripcion, tipo, orden, icono_url) FROM stdin;
d5ada448-ba40-4e23-aeca-38aab27c6d7b	2fa07d68-5133-4003-ac7c-bde173fcf253	Memorama	Empareja imagen con su palabra en Nggigua	memorama	1	\N
00a8da27-0fc0-4d29-9476-b3e489405129	2fa07d68-5133-4003-ac7c-bde173fcf253	Ahorcado	Adivina la palabra en Nggigua letra por letra	ahorcado	2	\N
89659afb-0c72-4dad-b3a8-ec378adb00d0	2fa07d68-5133-4003-ac7c-bde173fcf253	Atrapa la Palabra	Atrapa las palabras correctas que caen	atrapa_palabra	3	\N
eece0a2f-7c4e-4eca-9826-4bc41cfa4309	2fa07d68-5133-4003-ac7c-bde173fcf253	Empareja Columnas	Conecta cada palabra con su traducción	empareja	4	\N
0e850c46-4485-40c6-91e5-0433f3cce337	2fa07d68-5133-4003-ac7c-bde173fcf253	Ruleta de Categorías	Gira la ruleta y responde palabras por campo semántico	ruleta	5	\N
140c809d-a1f2-44c4-a5ca-414d19e6be1f	18283b5b-642c-4404-b0f5-0cf5a212e4d6	Memorama	Nivel intermedio	memorama	1	\N
3ca03ee0-5407-4a67-b213-3f50669de49c	18283b5b-642c-4404-b0f5-0cf5a212e4d6	Ahorcado	Nivel intermedio	ahorcado	2	\N
33164177-7187-4c4f-99f0-d7f8af7fb811	18283b5b-642c-4404-b0f5-0cf5a212e4d6	Atrapa la Palabra	Nivel intermedio	atrapa_palabra	3	\N
9c86df49-10fe-4cd2-af3a-b834e99dfbd0	18283b5b-642c-4404-b0f5-0cf5a212e4d6	Empareja Columnas	Nivel intermedio	empareja	4	\N
1ad64d7a-bf2e-42d1-9273-0ad4060ba291	18283b5b-642c-4404-b0f5-0cf5a212e4d6	Ruleta de Categorías	Nivel intermedio	ruleta	5	\N
58920c98-1c30-49b6-acb9-5d3792dee646	a8034194-6836-41ff-8d0d-f812a222bc80	Memorama	Nivel avanzado	memorama	1	\N
0049fbb2-a73b-4863-a6bb-6ef3cc6e5968	a8034194-6836-41ff-8d0d-f812a222bc80	Ahorcado	Nivel avanzado	ahorcado	2	\N
ac27a56b-73e1-4866-a8e7-c27d9b1fde16	a8034194-6836-41ff-8d0d-f812a222bc80	Atrapa la Palabra	Nivel avanzado	atrapa_palabra	3	\N
683f5a65-5931-4d84-a814-df5f682cdcd3	a8034194-6836-41ff-8d0d-f812a222bc80	Empareja Columnas	Nivel avanzado	empareja	4	\N
96954dcb-b7cd-4777-a215-0f9c6fd4edce	a8034194-6836-41ff-8d0d-f812a222bc80	Ruleta de Categorías	Nivel avanzado	ruleta	5	\N
\.


--
-- PostgreSQL database dump complete
--

\unrestrict wXCvEIsFCQoHfhGS6jt0fTv2gdUMDUz3lcY58bE8OWzbiFLrdjC2fipqnAWJLTA

