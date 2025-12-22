# Documentação da Estrutura do Projeto
**Gerado em:** 2025-12-19 06:08:26
**Caminho:** C:\Users\Fabio paiva\Downloads\loja_conect-main

## Estrutura de Pastas

\\\	ext├── .gitignore (2152 bytes)
├── analisar-projeto.ps1 (3536 bytes)
├── [api]
│   ├── [reservas]
│   │   ├── [id].ts (3523 bytes)
│   │   ├── [ativas]
│   │   │   ├── route.ts (1205 bytes)
│   │   ├── ativas.ts (1289 bytes)
│   ├── send-whatsapp.ts (689 bytes)
├── [backend]
│   ├── realtime.ts (751 bytes)
│   ├── [routes]
│   │   ├── saveSubscription.ts (6756 bytes)
│   ├── sendPush.ts (4885 bytes)
│   ├── supabaseClient.ts (424 bytes)
├── deploy.sh (2110 bytes)
├── index.html (286 bytes)
├── LICENSE (35149 bytes)
├── netlify.toml (120 bytes)
├── [node_modules]
│   ├── [.vite]
│   │   ├── [deps]
│   │   │   ├── @supabase_supabase-js.js (294096 bytes)
│   │   │   ├── @supabase_supabase-js.js.map (551013 bytes)
│   │   │   ├── _metadata.json (1839 bytes)
│   │   │   ├── browser-PETKTULP.js (246 bytes)
│   │   │   ├── browser-PETKTULP.js.map (93 bytes)
│   │   │   ├── chunk-4GTYTYO3.js (16489 bytes)
│   │   │   ├── chunk-4GTYTYO3.js.map (26411 bytes)
│   │   │   ├── chunk-K27EFMTG.js (43617 bytes)
│   │   │   ├── chunk-K27EFMTG.js.map (67855 bytes)
│   │   │   ├── chunk-Q7T37UUF.js (1180 bytes)
│   │   │   ├── chunk-Q7T37UUF.js.map (1366 bytes)
│   │   │   ├── chunk-V4OQ3NZ2.js (1733 bytes)
│   │   │   ├── chunk-V4OQ3NZ2.js.map (93 bytes)
│   │   │   ├── package.json (23 bytes)
│   │   │   ├── react.js (117 bytes)
│   │   │   ├── react.js.map (93 bytes)
│   │   │   ├── react_jsx-dev-runtime.js (12249 bytes)
│   │   │   ├── react_jsx-dev-runtime.js.map (18337 bytes)
│   │   │   ├── react_jsx-runtime.js (12651 bytes)
│   │   │   ├── react_jsx-runtime.js.map (18967 bytes)
│   │   │   ├── react-dom.js (155 bytes)
│   │   │   ├── react-dom.js.map (93 bytes)
│   │   │   ├── react-dom_client.js (901992 bytes)
│   │   │   ├── react-dom_client.js.map (1395106 bytes)
│   │   │   ├── react-router-dom.js (434875 bytes)
│   │   │   ├── react-router-dom.js.map (737219 bytes)
│   ├── [.vite-temp]
├── package.json (1333 bytes)
├── package-lock.json (254912 bytes)
├── postcss.config.cjs (82 bytes)
├── [public]
│   ├── [api]
│   │   ├── [push]
│   │   │   ├── subscribe.js (761 bytes)
│   ├── default-avatar.png (7204991 bytes)
│   ├── manifest.json (1273 bytes)
│   ├── offline.html (600 bytes)
│   ├── service-worker.js (2838 bytes)
│   ├── sw.js (13279 bytes)
├── README.md (13 bytes)
├── SETUP.md (715 bytes)
├── [src]
│   ├── App.tsx (19044 bytes)
│   ├── [components]
│   │   ├── AccessCard.tsx (974 bytes)
│   │   ├── AdicionarFuncionario.tsx (1437 bytes)
│   │   ├── [auth]
│   │   │   ├── CadastroCliente.tsx (2477 bytes)
│   │   │   ├── CadastroLojista.tsx (2652 bytes)
│   │   │   ├── LoginCliente.tsx (2882 bytes)
│   │   │   ├── LoginForm.tsx (3231 bytes)
│   │   │   ├── LoginLojista.tsx (4358 bytes)
│   │   │   ├── Signup.tsx (vazio)
│   │   ├── CategoryPreferences.tsx (52129 bytes)
│   │   ├── CategorySelector.tsx (8384 bytes)
│   │   ├── CategorySelectorModal.tsx (5164 bytes)
│   │   ├── [client]
│   │   │   ├── ClientEmployeesList.tsx (19313 bytes)
│   │   │   ├── Dashboard.tsx (14743 bytes)
│   │   │   ├── EmployeeSelector.tsx (11553 bytes)
│   │   │   ├── GlobalImageGallery.tsx (6698 bytes)
│   │   │   ├── Header.tsx (4479 bytes)
│   │   │   ├── ImageGallery.tsx (4456 bytes)
│   │   │   ├── MyReservations.tsx (13251 bytes)
│   │   │   ├── NotificationModal.tsx (6696 bytes)
│   │   │   ├── NotificationsPage.tsx (10447 bytes)
│   │   │   ├── ProductCard.tsx (4925 bytes)
│   │   │   ├── ProductModal.tsx (18251 bytes)
│   │   │   ├── ProductsList.tsx (21599 bytes)
│   │   │   ├── ProdutosCliente.tsx (7340 bytes)
│   │   │   ├── PromotionCardClient.tsx (3965 bytes)
│   │   │   ├── PromotionList.tsx (6420 bytes)
│   │   │   ├── ReservaItem.tsx (3283 bytes)
│   │   │   ├── ReservationsList.tsx (10900 bytes)
│   │   │   ├── ReservationTimer.tsx (6302 bytes)
│   │   │   ├── ReserveModal.tsx (23038 bytes)
│   │   │   ├── SettingsMenu.tsx (vazio)
│   │   │   ├── SettingsModal.tsx (11979 bytes)
│   │   ├── DebugAuth.tsx (3504 bytes)
│   │   ├── DebugRouter.tsx (2224 bytes)
│   │   ├── EnableNotifications.tsx (5382 bytes)
│   │   ├── [layout]
│   │   │   ├── StoreLayout.tsx (3533 bytes)
│   │   ├── Layout.tsx (405 bytes)
│   │   ├── ListaFuncionarios.tsx (1878 bytes)
│   │   ├── LogoutButton.tsx (452 bytes)
│   │   ├── MenuOpcoes.tsx (1434 bytes)
│   │   ├── MobileDashboard.tsx (5148 bytes)
│   │   ├── NotificationBell.tsx (3650 bytes)
│   │   ├── NotificationPreferences.tsx (17457 bytes)
│   │   ├── NotificationProvider.tsx (1432 bytes)
│   │   ├── NotificationRelLtx.tsx (1390 bytes)
│   │   ├── ProdutosReservados.tsx (1610 bytes)
│   │   ├── ProtectedRoute.tsx (1412 bytes)
│   │   ├── PushNotificationButton.tsx (3826 bytes)
│   │   ├── PushNotificationManager.tsx (5178 bytes)
│   │   ├── [QRScanner]
│   │   │   ├── CameraScanner.tsx (7515 bytes)
│   │   │   ├── ImageUploadScanner.tsx (3796 bytes)
│   │   │   ├── QRScanner.tsx (8417 bytes)
│   │   │   ├── Scanner.css (2255 bytes)
│   │   │   ├── ScannerConfigModal.tsx (2419 bytes)
│   │   ├── SettingsModal.tsx (5357 bytes)
│   │   ├── [store]
│   │   │   ├── CategoryManager.tsx (10989 bytes)
│   │   │   ├── Dashboard.tsx (19318 bytes)
│   │   │   ├── EmployeesList.tsx (28861 bytes)
│   │   │   ├── ProductForm.tsx (33062 bytes)
│   │   │   ├── ProductList.tsx (4564 bytes)
│   │   │   ├── ProductSearch.tsx (4801 bytes)
│   │   │   ├── PromotionCard.tsx (5034 bytes)
│   │   │   ├── PromotionForm.tsx (22521 bytes)
│   │   │   ├── PromotionManager.tsx (6745 bytes)
│   │   │   ├── ReservationsList.tsx (46885 bytes)
│   │   │   ├── StoreWaitTimeConfig.tsx (3338 bytes)
│   │   │   ├── Timer.tsx (12725 bytes)
│   │   ├── WhatsAppButton.tsx (5812 bytes)
│   ├── [config]
│   │   ├── notificationConfig.ts (4160 bytes)
│   ├── [constants]
│   │   ├── appConstants.ts (894 bytes)
│   ├── [context]
│   │   ├── AdminContext.tsx (2373 bytes)
│   │   ├── CategoryContext.tsx (6076 bytes)
│   │   ├── ClientContext.tsx (2226 bytes)
│   │   ├── NotificationContext.tsx (43052 bytes)
│   │   ├── NotificationContextLtx.tsx (3448 bytes)
│   │   ├── PromotionContext.tsx (4133 bytes)
│   │   ├── ReservationContext.tsx (7084 bytes)
│   │   ├── SettingsContext.tsx (3683 bytes)
│   │   ├── StoreContext.tsx (2811 bytes)
│   │   ├── ThemeContext.tsx (1038 bytes)
│   ├── [controllers]
│   │   ├── categoryController.ts (6853 bytes)
│   │   ├── notificationController.ts (2834 bytes)
│   ├── [hooks]
│   │   ├── useAuth.ts (11565 bytes)
│   │   ├── useCategorias.ts (7146 bytes)
│   │   ├── useCategoriasCliente.ts (1501 bytes)
│   │   ├── useConfiguracoesCliente.ts (2575 bytes)
│   │   ├── useCreateReserva.ts (1197 bytes)
│   │   ├── useMobileDetection.tsx (702 bytes)
│   │   ├── useNotificationPreferences.ts (2390 bytes)
│   │   ├── useNotifications.ts (5950 bytes)
│   │   ├── useNotificationSystem.ts (5944 bytes)
│   │   ├── usePushNotifications.ts (28053 bytes)
│   │   ├── useReservas.ts (954 bytes)
│   │   ├── useReservation.ts (3055 bytes)
│   │   ├── useReservationFlow.ts (13444 bytes)
│   │   ├── useReservationNotifications.ts (2277 bytes)
│   │   ├── useReservations.ts (2942 bytes)
│   │   ├── useReservationSystem.ts (13798 bytes)
│   │   ├── useReservationTimer.ts (3105 bytes)
│   │   ├── useReservationUpdates.ts (1572 bytes)
│   │   ├── UserMenu.tsx (4223 bytes)
│   │   ├── useStoreNotifications.ts (1267 bytes)
│   │   ├── useSupabase.ts (38565 bytes)
│   ├── index.css (1028 bytes)
│   ├── [lib]
│   │   ├── supabaseClient.ts (11062 bytes)
│   ├── main.tsx (1790 bytes)
│   ├── [models]
│   │   ├── Category.ts (1481 bytes)
│   │   ├── User.ts (1447 bytes)
│   ├── [pages]
│   │   ├── [admin]
│   │   │   ├── PromotionCreate.tsx (309 bytes)
│   │   │   ├── PromotionsScreen.tsx (320 bytes)
│   │   ├── [api]
│   │   │   ├── create-reserva.ts (4007 bytes)
│   │   ├── Categorias.tsx (13537 bytes)
│   │   ├── [Cliente]
│   │   │   ├── ClienteProdutos.tsx (91 bytes)
│   │   │   ├── ClientePromocoes.tsx (86 bytes)
│   │   │   ├── ClienteScanear.tsx (91 bytes)
│   │   │   ├── QRScannerPage.tsx (133 bytes)
│   │   ├── ConfigPage.jsx (1054 bytes)
│   │   ├── Home.tsx (1445 bytes)
│   │   ├── HomeSelection.tsx (2175 bytes)
│   │   ├── ProdutoPage.tsx (549 bytes)
│   │   ├── ReservaPage.tsx (775 bytes)
│   ├── [painelLoja]
│   │   ├── [Component]
│   │   │   ├── QRCodeGenerator.tsx (1375 bytes)
│   ├── [routes]
│   │   ├── AppRoutes.tsx (2046 bytes)
│   ├── [screens]
│   │   ├── CategoriesScreen.tsx (16611 bytes)
│   │   ├── DashboardScreen.tsx (268 bytes)
│   │   ├── NotificationsScreen.tsx (23259 bytes)
│   ├── [services]
│   │   ├── adminService.ts (1611 bytes)
│   │   ├── api.ts (8298 bytes)
│   │   ├── categoryService.ts (13008 bytes)
│   │   ├── clientService.ts (1742 bytes)
│   │   ├── [email]
│   │   │   ├── sendEmail.ts (621 bytes)
│   │   │   ├── [templates]
│   │   │   │   ├── orderCreated.ts (292 bytes)
│   │   │   │   ├── productCreated.ts (198 bytes)
│   │   │   │   ├── productPromotion.ts (276 bytes)
│   │   ├── emailService.ts (612 bytes)
│   │   ├── employeeService.ts (1116 bytes)
│   │   ├── [notifications]
│   │   │   ├── sendCategoryPush.ts (838 bytes)
│   │   ├── notificationService.ts (71466 bytes)
│   │   ├── notificationSystem.ts (11835 bytes)
│   │   ├── [orders]
│   │   │   ├── createOrder.ts (281 bytes)
│   │   ├── productService.ts (10262 bytes)
│   │   ├── promotionService.ts (12597 bytes)
│   │   ├── pushSubscription.ts (11187 bytes)
│   │   ├── reservationMonitor.ts (4438 bytes)
│   │   ├── reservationService.ts (19679 bytes)
│   │   ├── reservationStorage.ts (2233 bytes)
│   │   ├── storeIdManager.ts (1730 bytes)
│   │   ├── storeService.ts (1873 bytes)
│   │   ├── supabase.ts (12081 bytes)
│   │   ├── whatsapp.ts (11694 bytes)
│   ├── [styles]
│   │   ├── globals.css (3076 bytes)
│   │   ├── ProductModal.module.css (2419 bytes)
│   │   ├── Products.module.css (1068 bytes)
│   ├── [types]
│   │   ├── Category.ts (894 bytes)
│   │   ├── ClienteData.ts (174 bytes)
│   │   ├── Employee.ts (703 bytes)
│   │   ├── env.d.ts (550 bytes)
│   │   ├── Funcionario.ts (470 bytes)
│   │   ├── FuncionarioData.ts (131 bytes)
│   │   ├── index.ts (1696 bytes)
│   │   ├── notification.ts (8814 bytes)
│   │   ├── ProductData.ts (11449 bytes)
│   │   ├── Promotion.ts (1012 bytes)
│   │   ├── ReservaData.ts (200 bytes)
│   │   ├── Reservation.ts (1695 bytes)
│   │   ├── service-worker.d.ts (2088 bytes)
│   │   ├── supabase.ts (16812 bytes)
│   │   ├── User.ts (1227 bytes)
│   ├── [utils]
│   │   ├── browserCompatibility.ts (12328 bytes)
│   │   ├── buttonStyles.ts (1380 bytes)
│   │   ├── cameraDetection.ts (1278 bytes)
│   │   ├── cleanAuth.ts (1508 bytes)
│   │   ├── constants.ts (vazio)
│   │   ├── notificationUtils.ts (7319 bytes)
│   │   ├── pushNotifications.ts (17599 bytes)
│   │   ├── qrScanner.ts (2164 bytes)
│   │   ├── realtime.ts (4109 bytes)
│   │   ├── serviceWorkerFallback.ts (2126 bytes)
│   │   ├── supabaseFunctionHelper.ts (2985 bytes)
│   │   ├── tailwindCheck.ts (354 bytes)
│   │   ├── timeUtils.ts (3464 bytes)
│   │   ├── userAuthNotifications.ts (2344 bytes)
│   │   ├── uuidValidator.ts (3584 bytes)
│   │   ├── validation.ts (401 bytes)
│   │   ├── vapidGenerator.ts (2465 bytes)
│   ├── vite-env.d.ts (517 bytes)
├── [supabase]
│   ├── .gitignore (12 bytes)
│   ├── [_shared]
│   │   ├── cors.ts (223 bytes)
│   ├── config.toml (3886 bytes)
│   ├── [docker]
│   │   ├── .env.example (3940 bytes)
│   │   ├── .gitignore (75 bytes)
│   │   ├── CHANGELOG.md (8148 bytes)
│   │   ├── [dev]
│   │   │   ├── data.sql (vazio)
│   │   │   ├── docker-compose.dev.yml (956 bytes)
│   │   ├── docker-compose.s3.yml (2604 bytes)
│   │   ├── docker-compose.yml (18288 bytes)
│   │   ├── README.md (4573 bytes)
│   │   ├── reset.sh (1108 bytes)
│   │   ├── versions.md (2690 bytes)
│   │   ├── [volumes]
│   │   │   ├── [api]
│   │   │   │   ├── kong.yml (6851 bytes)
│   │   │   ├── [db]
│   │   │   │   ├── _supabase.sql (83 bytes)
│   │   │   │   ├── [init]
│   │   │   │   │   ├── data.sql (vazio)
│   │   │   │   ├── jwt.sql (207 bytes)
│   │   │   │   ├── logs.sql (144 bytes)
│   │   │   │   ├── pooler.sql (144 bytes)
│   │   │   │   ├── realtime.sql (117 bytes)
│   │   │   │   ├── roles.sql (379 bytes)
│   │   │   │   ├── webhooks.sql (8771 bytes)
│   │   │   ├── [functions]
│   │   │   │   ├── [hello]
│   │   │   │   │   ├── index.ts (563 bytes)
│   │   │   │   ├── [main]
│   │   │   │   │   ├── index.ts (2617 bytes)
│   │   │   ├── [pooler]
│   │   │   │   ├── pooler.exs (1068 bytes)
│   ├── [functions]
│   │   ├── deno.json (135 bytes)
│   │   ├── [sendPushNotification]
│   │   │   ├── .npmrc (221 bytes)
│   │   │   ├── deno.json (79 bytes)
│   │   │   ├── deno.jsonc (39 bytes)
│   │   │   ├── import_map.json (213 bytes)
│   │   │   ├── index.ts (9935 bytes)
│   │   ├── [subscribe]
│   │   │   ├── index.ts (1474 bytes)
│   │   ├── [subscriptions]
│   │   │   ├── [[userId]]
│   │   ├── [vapid-public-key]
│   │   │   ├── index.ts (738 bytes)
│   ├── LICENSE (1088 bytes)
│   ├── [migrations]
│   │   ├── 20240101000000_complete_store_system.sql (7598 bytes)
│   ├── README.md (4764 bytes)
│   ├── [send-category-alert]
│   │   ├── index.ts (2152 bytes)
│   ├── [send-email]
│   │   ├── index.ts (1308 bytes)
│   ├── supabase.exe (44376576 bytes)
│   ├── [system-migrations]
│   │   ├── [gotrue]
│   │   │   ├── 00_init_auth_schema.up.sql (3771 bytes)
│   │   │   ├── 20210710035447_alter_users.up.sql (772 bytes)
│   │   │   ├── 20210722035447_adds_confirmed_at.up.sql (212 bytes)
│   │   │   ├── 20210730183235_add_email_change_confirmed.up.sql (666 bytes)
│   │   │   ├── 20210909172000_create_identities_table.up.sql (623 bytes)
│   │   │   ├── 20210927181326_add_refresh_token_parent.up.sql (1096 bytes)
│   │   │   ├── 20211122151130_create_user_id_idx.up.sql (161 bytes)
│   │   │   ├── 20211124214934_update_auth_functions.up.sql (823 bytes)
│   │   │   ├── 20211202183645_update_auth_uid.up.sql (311 bytes)
│   │   │   ├── 20220114185221_update_user_idx.up.sql (241 bytes)
│   │   │   ├── 20220114185340_add_banned_until.up.sql (136 bytes)
│   │   │   ├── 20220224000811_update_auth_functions.up.sql (895 bytes)
│   │   │   ├── 20220323170000_add_user_reauthentication.up.sql (272 bytes)
│   │   │   ├── 20220429102000_add_unique_idx.up.sql (1420 bytes)
│   │   │   ├── 20220531120530_add_auth_jwt_function.up.sql (644 bytes)
│   │   │   ├── 20220614074223_add_ip_address_to_audit_log.postgres.up.sql (163 bytes)
│   │   │   ├── 20220811173540_add_sessions_table.up.sql (1109 bytes)
│   │   │   ├── 20221003041349_add_mfa_schema.up.sql (2524 bytes)
│   │   │   ├── 20221003041400_add_aal_and_factor_id_to_sessions.up.sql (230 bytes)
│   │   │   ├── 20221011041400_add_mfa_indexes.up.sql (728 bytes)
│   │   │   ├── 20221020193600_add_sessions_user_id_index.up.sql (105 bytes)
│   │   │   ├── 20221021073300_add_refresh_tokens_session_id_revoked_index.up.sql (139 bytes)
│   │   │   ├── 20221021082433_add_saml.up.sql (4474 bytes)
│   │   │   ├── 20221027105023_add_identities_user_id_idx.up.sql (120 bytes)
│   │   │   ├── 20221114143122_add_session_not_after_column.up.sql (304 bytes)
│   │   │   ├── 20221114143410_remove_parent_foreign_key_refresh_tokens.up.sql (111 bytes)
│   │   │   ├── 20221125140132_backfill_email_identity.up.sql (683 bytes)
│   │   │   ├── 20221208132122_backfill_email_last_sign_in_at.up.sql (358 bytes)
│   │   │   ├── 20221215195500_modify_users_email_unique_index.up.sql (1256 bytes)
│   │   │   ├── 20221215195800_add_identities_email_column.up.sql (943 bytes)
│   │   │   ├── 20221215195900_remove_sso_sessions.up.sql (141 bytes)
│   │   │   ├── 20230116124310_alter_phone_type.up.sql (579 bytes)
│   │   │   ├── 20230116124412_add_deleted_at.up.sql (148 bytes)
│   │   │   ├── 20230131181311_backfill_invite_identities.up.sql (622 bytes)
│   │   │   ├── 20230322519590_add_flow_state_table.up.sql (905 bytes)
│   │   │   ├── 20230402418590_add_authentication_method_to_flow_state_table.up.sql (399 bytes)
│   │   │   ├── 20230411005111_remove_duplicate_idx.up.sql (79 bytes)
│   │   │   ├── 20230508135423_add_cleanup_indexes.up.sql (566 bytes)
│   │   │   ├── 20230523124323_add_mfa_challenge_cleanup_index.up.sql (172 bytes)
│   │   │   ├── 20230818113222_add_flow_state_to_relay_state.up.sql (198 bytes)
│   │   │   ├── 20230914180801_add_mfa_factors_user_id_idx.up.sql (109 bytes)
│   │   │   ├── 20231027141322_add_session_refresh_columns.up.sql (213 bytes)
│   │   │   ├── 20231114161723_add_sessions_tag.up.sql (101 bytes)
│   │   │   ├── 20231117164230_add_id_pkey_identities.up.sql (1002 bytes)
│   │   │   ├── 20240115144230_remove_ip_address_from_saml_relay_state.up.sql (317 bytes)
│   │   │   ├── 20240214120130_add_is_anonymous_column.up.sql (273 bytes)
│   │   │   ├── 20240306115329_add_issued_at_to_flow_state.up.sql (138 bytes)
│   │   │   ├── 20240314092811_add_saml_name_id_format.up.sql (130 bytes)
│   │   │   ├── 20240427152123_add_one_time_tokens_table.up.sql (1617 bytes)
│   │   │   ├── 20240612123726_enable_rls_update_grants.up.sql (3148 bytes)
│   │   │   ├── 20240729123726_add_mfa_phone_config.up.sql (498 bytes)
│   │   │   ├── 20240802193726_add_mfa_factors_column_last_challenged_at.up.sql (134 bytes)
│   │   │   ├── 20240806073726_drop_uniqueness_constraint_on_phone.up.sql (910 bytes)
│   │   │   ├── 20241009103726_add_web_authn.up.sql (345 bytes)
│   │   │   ├── 20250717082212_add_disabled_to_sso_providers.up.sql (317 bytes)
│   │   │   ├── 20250731150234_add_oauth_clients_table.up.sql (1446 bytes)
│   │   │   ├── 20250804100000_add_oauth_authorizations_consents.up.sql (4279 bytes)
│   │   │   ├── 20250901200500_add_oauth_client_type.up.sql (702 bytes)
│   │   │   ├── 20250903112500_remove_oauth_client_id_column.up.sql (549 bytes)
│   │   │   ├── 20250904133000_add_oauth_client_id_to_session.up.sql (567 bytes)
│   │   │   ├── 20250925093508_add_last_webauthn_challenge_data.up.sql (391 bytes)
│   │   │   ├── 20251007112900_add_session_refresh_token_columns.up.sql (583 bytes)
│   │   │   ├── 20251104100000_add_nonce_to_oauth_authorizations.up.sql (341 bytes)
│   │   │   ├── 20251111201300_add_scopes_to_sessions.up.sql (509 bytes)
│   │   │   ├── 20251201000000_add_oauth_client_states_table.up.sql (619 bytes)
│   │   ├── [storage-api]
│   │   │   ├── 00010-search-files-search-function.sql (2129 bytes)
│   │   │   ├── 0001-initialmigration.sql (8 bytes)
│   │   │   ├── 0002-storage-schema.sql (6425 bytes)
│   │   │   ├── 0003-pathtoken-column.sql (1019 bytes)
│   │   │   ├── 0004-add-migrations-rls.sql (57 bytes)
│   │   │   ├── 0005-add-size-functions.sql (367 bytes)
│   │   │   ├── 0006-change-column-name-in-get-size.sql (366 bytes)
│   │   │   ├── 0007-add-rls-to-buckets.sql (54 bytes)
│   │   │   ├── 0008-add-public-to-buckets.sql (84 bytes)
│   │   │   ├── 0009-fix-search-function.sql (895 bytes)
│   │   │   ├── 0011-add-trigger-to-auto-update-updated_at-column.sql (355 bytes)
│   │   │   ├── 0012-add-automatic-avif-detection-flag.sql (92 bytes)
│   │   │   ├── 0013-add-bucket-custom-limits.sql (180 bytes)
│   │   │   ├── 0014-use-bytes-for-max-size.sql (567 bytes)
│   │   │   ├── 0015-add-can-insert-object-function.sql (415 bytes)
│   │   │   ├── 0016-add-version.sql (80 bytes)
│   │   │   ├── 0017-drop-owner-foreign-key.sql (77 bytes)
│   │   │   ├── 0018-add_owner_id_column_deprecate_owner.sql (418 bytes)
│   │   │   ├── 0019-alter-default-value-objects-id.sql (74 bytes)
│   │   │   ├── 0020-list-objects-with-delimiter.sql (1859 bytes)
│   │   │   ├── 0021-s3-multipart-uploads.sql (3921 bytes)
│   │   │   ├── 0022-s3-multipart-uploads-big-ints.sql (161 bytes)
│   │   │   ├── 0023-optimize-search-function.sql (2051 bytes)
│   │   │   ├── 0024-operation-function.sql (163 bytes)
│   │   │   ├── 0025-custom-metadata.sql (170 bytes)
│   │   │   ├── 0026-objects-prefixes.sql (5334 bytes)
│   │   │   ├── 0027-search-v2.sql (1613 bytes)
│   │   │   ├── 0028-object-bucket-name-sorting.sql (176 bytes)
│   │   │   ├── 0029-create-prefixes.sql (3591 bytes)
│   │   │   ├── 0030-update-object-levels.sql (3418 bytes)
│   │   │   ├── 0031-objects-level-index.sql (189 bytes)
│   │   │   ├── 0032-backward-compatible-index-on-objects.sql (197 bytes)
│   │   │   ├── 0033-backward-compatible-index-on-prefixes.sql (216 bytes)
│   │   │   ├── 0034-optimize-search-function-v1.sql (5358 bytes)
│   │   │   ├── 0035-add-insert-trigger-prefixes.sql (310 bytes)
│   │   │   ├── 0036-optimise-existing-functions.sql (4135 bytes)
│   │   │   ├── 0037-add-bucket-name-length-trigger.sql (541 bytes)
│   │   │   ├── 0038-iceberg-catalog-flag-on-buckets.sql (3494 bytes)
│   │   │   ├── 0039-add-search-v2-sort-support.sql (3254 bytes)
│   │   │   ├── 0040-fix-prefix-race-conditions-optimized.sql (8808 bytes)
│   │   │   ├── 0041-add-object-level-update-trigger.sql (2519 bytes)
│   │   │   ├── 0042-rollback-prefix-triggers.sql (1299 bytes)
│   │   │   ├── 0043-fix-object-level.sql (414 bytes)
│   │   │   ├── 0044-vector-bucket-type.sql (354 bytes)
│   │   │   ├── 0045-vector-buckets.sql (1896 bytes)
│   │   │   ├── 0046-buckets-objects-grants.sql (659 bytes)
│   │   │   ├── 0047-iceberg-table-metadata.sql (559 bytes)
│   │   │   ├── 0048-iceberg-catalog-ids.sql (4029 bytes)
│   │   │   ├── 0049-buckets-objects-grants-postgres.sql (178 bytes)
├── tailwind.config.ts (1158 bytes)
├── tsconfig.json (854 bytes)
├── tsconfig.node.json (221 bytes)
├── vite.config.ts (1545 bytes)
├── workbox-config.js (937 bytes)
\\\

## Arquivos por Tipo
### .sql (124 arquivos)

- \$(supabase\docker\dev\data.sql)\ (0 bytes)
- \$(supabase\docker\volumes\db\jwt.sql)\ (207 bytes)
- \$(supabase\docker\volumes\db\logs.sql)\ (144 bytes)
- \$(supabase\docker\volumes\db\pooler.sql)\ (144 bytes)
- \$(supabase\docker\volumes\db\realtime.sql)\ (117 bytes)
- \$(supabase\docker\volumes\db\roles.sql)\ (379 bytes)
- \$(supabase\docker\volumes\db\webhooks.sql)\ (8771 bytes)
- \$(supabase\docker\volumes\db\_supabase.sql)\ (83 bytes)
- \$(supabase\docker\volumes\db\init\data.sql)\ (0 bytes)
- \$(supabase\migrations\20240101000000_complete_store_system.sql)\ (7598 bytes)
- ... mais 114 arquivos

### .ts (103 arquivos)

- \$(tailwind.config.ts)\ (1158 bytes)
- \$(vite.config.ts)\ (1545 bytes)
- \$(api\send-whatsapp.ts)\ (689 bytes)
- \$(api\reservas\ativas.ts)\ (1289 bytes)
- \$(api\reservas\[id].ts)\ (3523 bytes)
- \$(api\reservas\ativas\route.ts)\ (1205 bytes)
- \$(backend\realtime.ts)\ (751 bytes)
- \$(backend\sendPush.ts)\ (4885 bytes)
- \$(backend\supabaseClient.ts)\ (424 bytes)
- \$(backend\routes\saveSubscription.ts)\ (6756 bytes)
- ... mais 93 arquivos

### .tsx (97 arquivos)

- \$(src\App.tsx)\ (19044 bytes)
- \$(src\main.tsx)\ (1790 bytes)
- \$(src\components\AccessCard.tsx)\ (974 bytes)
- \$(src\components\AdicionarFuncionario.tsx)\ (1437 bytes)
- \$(src\components\CategoryPreferences.tsx)\ (52129 bytes)
- \$(src\components\CategorySelector.tsx)\ (8384 bytes)
- \$(src\components\CategorySelectorModal.tsx)\ (5164 bytes)
- \$(src\components\DebugAuth.tsx)\ (3504 bytes)
- \$(src\components\DebugRouter.tsx)\ (2224 bytes)
- \$(src\components\EnableNotifications.tsx)\ (5382 bytes)
- ... mais 87 arquivos

### .js (16 arquivos)

- \$(workbox-config.js)\ (937 bytes)
- \$(node_modules\.vite\deps\@supabase_supabase-js.js)\ (294096 bytes)
- \$(node_modules\.vite\deps\browser-PETKTULP.js)\ (246 bytes)
- \$(node_modules\.vite\deps\chunk-4GTYTYO3.js)\ (16489 bytes)
- \$(node_modules\.vite\deps\chunk-K27EFMTG.js)\ (43617 bytes)
- \$(node_modules\.vite\deps\chunk-Q7T37UUF.js)\ (1180 bytes)
- \$(node_modules\.vite\deps\chunk-V4OQ3NZ2.js)\ (1733 bytes)
- \$(node_modules\.vite\deps\react-dom.js)\ (155 bytes)
- \$(node_modules\.vite\deps\react-dom_client.js)\ (901992 bytes)
- \$(node_modules\.vite\deps\react-router-dom.js)\ (434875 bytes)
- ... mais 6 arquivos

### .map (12 arquivos)

- \$(node_modules\.vite\deps\@supabase_supabase-js.js.map)\ (551013 bytes)
- \$(node_modules\.vite\deps\browser-PETKTULP.js.map)\ (93 bytes)
- \$(node_modules\.vite\deps\chunk-4GTYTYO3.js.map)\ (26411 bytes)
- \$(node_modules\.vite\deps\chunk-K27EFMTG.js.map)\ (67855 bytes)
- \$(node_modules\.vite\deps\chunk-Q7T37UUF.js.map)\ (1366 bytes)
- \$(node_modules\.vite\deps\chunk-V4OQ3NZ2.js.map)\ (93 bytes)
- \$(node_modules\.vite\deps\react-dom.js.map)\ (93 bytes)
- \$(node_modules\.vite\deps\react-dom_client.js.map)\ (1395106 bytes)
- \$(node_modules\.vite\deps\react-router-dom.js.map)\ (737219 bytes)
- \$(node_modules\.vite\deps\react.js.map)\ (93 bytes)
- ... mais 2 arquivos

### .json (10 arquivos)

- \$(package-lock.json)\ (254912 bytes)
- \$(package.json)\ (1333 bytes)
- \$(tsconfig.json)\ (854 bytes)
- \$(tsconfig.node.json)\ (221 bytes)
- \$(node_modules\.vite\deps\package.json)\ (23 bytes)
- \$(node_modules\.vite\deps\_metadata.json)\ (1839 bytes)
- \$(public\manifest.json)\ (1273 bytes)
- \$(supabase\functions\deno.json)\ (135 bytes)
- \$(supabase\functions\sendPushNotification\deno.json)\ (79 bytes)
- \$(supabase\functions\sendPushNotification\import_map.json)\ (213 bytes)

### .md (6 arquivos)

- \$(README.md)\ (13 bytes)
- \$(SETUP.md)\ (715 bytes)
- \$(supabase\README.md)\ (4764 bytes)
- \$(supabase\docker\CHANGELOG.md)\ (8148 bytes)
- \$(supabase\docker\README.md)\ (4573 bytes)
- \$(supabase\docker\versions.md)\ (2690 bytes)

### .css (5 arquivos)

- \$(src\index.css)\ (1028 bytes)
- \$(src\components\QRScanner\Scanner.css)\ (2255 bytes)
- \$(src\styles\globals.css)\ (3076 bytes)
- \$(src\styles\ProductModal.module.css)\ (2419 bytes)
- \$(src\styles\Products.module.css)\ (1068 bytes)

### .yml (4 arquivos)

- \$(supabase\docker\docker-compose.s3.yml)\ (2604 bytes)
- \$(supabase\docker\docker-compose.yml)\ (18288 bytes)
- \$(supabase\docker\dev\docker-compose.dev.yml)\ (956 bytes)
- \$(supabase\docker\volumes\api\kong.yml)\ (6851 bytes)

### .gitignore (3 arquivos)

- \$(.gitignore)\ (2152 bytes)
- \$(supabase\.gitignore)\ (12 bytes)
- \$(supabase\docker\.gitignore)\ (75 bytes)

### .sh (2 arquivos)

- \$(deploy.sh)\ (2110 bytes)
- \$(supabase\docker\reset.sh)\ (1108 bytes)

### .html (2 arquivos)

- \$(index.html)\ (286 bytes)
- \$(public\offline.html)\ (600 bytes)

### .toml (2 arquivos)

- \$(netlify.toml)\ (120 bytes)
- \$(supabase\config.toml)\ (3886 bytes)

### (sem extensão) (2 arquivos)

- \$(LICENSE)\ (35149 bytes)
- \$(supabase\LICENSE)\ (1088 bytes)

### .ps1 (1 arquivos)

- \$(analisar-projeto.ps1)\ (3536 bytes)

### .jsonc (1 arquivos)

- \$(supabase\functions\sendPushNotification\deno.jsonc)\ (39 bytes)

### .npmrc (1 arquivos)

- \$(supabase\functions\sendPushNotification\.npmrc)\ (221 bytes)

### .exs (1 arquivos)

- \$(supabase\docker\volumes\pooler\pooler.exs)\ (1068 bytes)

### .png (1 arquivos)

- \$(public\default-avatar.png)\ (7204991 bytes)

### .cjs (1 arquivos)

- \$(postcss.config.cjs)\ (82 bytes)

### .jsx (1 arquivos)

- \$(src\pages\ConfigPage.jsx)\ (1054 bytes)

### .example (1 arquivos)

- \$(supabase\docker\.env.example)\ (3940 bytes)

### .exe (1 arquivos)

- \$(supabase\supabase.exe)\ (44376576 bytes)

## Estatísticas do Projeto- **Total de Arquivos:** 397
- **Total de Pastas:** 66
- **Tamanho Total:** 55,25 MB
