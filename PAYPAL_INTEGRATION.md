# PayPal Integration Guide

Ce guide explique comment configurer et utiliser PayPal comme méthode de paiement parallèlement à Stripe.

## 📋 Configuration

### Variables d'environnement requises

Ajoutez les variables suivantes à votre fichier `.env` du backend:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_ENVIRONMENT=sandbox  # ou 'production' pour la production
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id  # Optionnel
```

### Obtenir les clés PayPal

1. Allez sur [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Créez une application dans l'onglet "My Apps & Credentials"
3. Copiez le `Client ID` et le `Secret` pour l'environnement sandbox ou production

## 🗄️ Migration de la base de données

Vous devez créer et appliquer une migration Prisma pour ajouter les champs PayPal:

```bash
cd e-learning-platform-backend
npx prisma migrate dev --name add_paypal_payment_support
```

Cela ajoutera les champs suivants au modèle `PaymentSession`:

- `paypalOrderId`: ID de la commande PayPal
- `paypalPaymentId`: ID du paiement PayPal capturé
- `provider`: Méthode de paiement utilisée (STRIPE ou PAYPAL)

## 🔧 Utilisation

### Backend

Le service PayPal est automatiquement initialisé dans `PaymentService`. Vous pouvez créer une session de paiement avec PayPal en spécifiant le provider:

```typescript
const result = await paymentService.createPaymentSession(
  {
    courseId: 'course_123',
    provider: 'PAYPAL', // ou "STRIPE" pour Stripe
    returnUrl: 'https://yoursite.com/success',
    cancelUrl: 'https://yoursite.com/cancel',
  },
  userId,
);
```

### Frontend

Dans le composant checkout, l'utilisateur peut choisir entre Stripe et PayPal. Le provider est passé automatiquement lors de la création de la session:

```typescript
const session = await createSession({
  courseId: courseId,
  provider: selectedProvider, // "STRIPE" ou "PAYPAL"
  // ... autres paramètres
});
```

## 🔄 Flux de paiement PayPal

1. **Création de la commande**: Le backend crée une commande PayPal via l'API
2. **Redirection**: L'utilisateur est redirigé vers PayPal pour autoriser le paiement
3. **Retour**: PayPal redirige vers `returnUrl` avec l'ID de commande
4. **Capture**: Le backend capture automatiquement le paiement lors du retour
5. **Enrollment**: Une fois le paiement confirmé, l'inscription est créée

## 📡 Webhooks PayPal

Pour configurer les webhooks PayPal:

1. Allez dans votre application PayPal Developer Dashboard
2. Configurez une URL de webhook: `https://yourbackend.com/api/payments/webhooks/paypal`
3. Copiez l'ID du webhook dans `PAYPAL_WEBHOOK_ID`
4. Les événements suivants sont gérés:
   - `PAYMENT.CAPTURE.COMPLETED`: Confirme automatiquement le paiement

## ⚠️ Notes importantes

- Le SDK PayPal utilisé (`@paypal/checkout-server-sdk`) est déprécié mais fonctionnel
- Pour la production, considérez migrer vers `@paypal/paypal-server-sdk`
- Assurez-vous que les webhooks sont configurés correctement pour la production
- Les montants sont convertis de centimes vers des dollars pour PayPal

## 🧪 Test

### Comptes PayPal Sandbox Nécessaires

Pour tester l'implémentation actuelle (paiements simples), vous avez besoin de **2 comptes** :

1. **Compte Plateforme (Business)**
   - Type : Business Account
   - Usage : Recevoir les paiements des étudiants
   - Credentials : Utilisé pour `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`
   - Création : PayPal Developer Dashboard → Sandbox → Accounts → Create Account (Business)

2. **Compte Étudiant (Personal)**
   - Type : Personal Account
   - Usage : Simuler un étudiant qui paie
   - Pas besoin de credentials - juste pour se connecter sur PayPal
   - Création : PayPal Developer Dashboard → Sandbox → Accounts → Create Account (Personal)

### Obtenir les Credentials

1. Allez sur [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Dashboard → Sandbox → Accounts
3. Créez un compte Business pour la plateforme
4. Dashboard → My Apps & Credentials
5. Sous "Sandbox", créez une nouvelle App
6. Copiez le **Client ID** et **Secret** dans votre `.env`

### Workflow de Test

```bash
1. Configurez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET (compte plateforme)
2. Lancez votre backend et frontend
3. Sur le checkout, choisissez PayPal
4. Connectez-vous avec le compte étudiant sandbox (pas le compte plateforme)
5. Complétez le paiement
6. Vérifiez que l'argent arrive au compte plateforme dans le dashboard PayPal
```

### ⚠️ Note sur le Split avec Instructeurs

**L'implémentation actuelle ne supporte PAS encore** le split PayPal (comme Stripe Connect pour les sessions live).

- ✅ Les paiements de cours fonctionnent (100% vers la plateforme)
- ❌ Les sessions live avec split vers les instructeurs ne sont pas encore implémentées pour PayPal
- 💡 Pour les sessions live, utilisez Stripe Connect (déjà implémenté)

Pour plus de détails sur les tests, voir [PAYPAL_TESTING_GUIDE.md](./PAYPAL_TESTING_GUIDE.md)

## 📚 Ressources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Orders API](https://developer.paypal.com/docs/api/orders/v2/)
- [PayPal Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
