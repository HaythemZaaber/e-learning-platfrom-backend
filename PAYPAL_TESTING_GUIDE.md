# Guide de Test PayPal - Architecture et Comptes

## 📋 Comprendre l'Architecture Actuelle

Votre plateforme e-learning a **deux types de paiements** :

### 1. **Paiements de Cours (Course Payments)**
- **Étudiant** → paie → **Plateforme**
- La plateforme garde 100% du montant
- Pas de split avec les instructeurs pour les cours

### 2. **Paiements de Sessions Live (Live Sessions)**
- **Étudiant** → paie → **Plateforme** → split → **Instructeur**
- La plateforme garde ~20% de commission
- L'instructeur reçoit ~80% du montant
- Actuellement implémenté avec **Stripe Connect**

## 🔄 PayPal : État Actuel vs Future

### ✅ **Implémentation Actuelle**
- PayPal est configuré pour les **paiements simples** (étudiants → plateforme)
- Tous les paiements PayPal vont directement au compte de la plateforme
- **Pas encore de système de split** comme Stripe Connect

### 🚧 **Future Implémentation (Recommandée)**
Pour avoir le même système que Stripe Connect, il faudrait utiliser :
- **PayPal Marketplace** ou **PayPal Payments Pro**
- Permet de splitter les paiements entre plateforme et instructeurs

## 🧪 Comptes PayPal pour Tests

### **Scénario 1 : Tests Simples (Actuel) - 2 Comptes**

Pour tester les paiements de cours uniquement :

1. **Compte Plateforme (Business)** 
   - Rôle : Recevoir les paiements des étudiants
   - Type : Business Account (Sandbox)
   - Usage : Compte principal de la plateforme
   - Credentials : `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`

2. **Compte Étudiant (Personal)**
   - Rôle : Simuler un étudiant qui paie
   - Type : Personal Account (Sandbox)
   - Usage : Tester les paiements
   - Pas besoin de credentials - juste pour se connecter sur PayPal

**Comment créer :**
```bash
1. Allez sur https://developer.paypal.com/
2. Dashboard → Sandbox → Accounts
3. Créez :
   - Un compte "Business" (pour la plateforme)
   - Un compte "Personal" (pour l'étudiant test)
```

### **Scénario 2 : Tests Complets avec Split (Futur) - 3+ Comptes**

Si vous voulez tester le système complet (comme Stripe Connect) :

1. **Compte Plateforme (Business)**
   - Recevoir les paiements
   - Splitter avec les instructeurs

2. **Compte Instructeur 1 (Business)**
   - Recevoir sa part (80%) du paiement

3. **Compte Instructeur 2 (Business)** - Optionnel
   - Pour tester avec plusieurs instructeurs

4. **Compte Étudiant (Personal)**
   - Simuler les paiements

## 📝 Configuration Actuelle Recommandée

### Pour commencer (Minimum requis) :

**Variables d'environnement (.env)** :
```env
# PayPal Platform Account (Business Sandbox)
PAYPAL_CLIENT_ID=your_platform_business_client_id
PAYPAL_CLIENT_SECRET=your_platform_business_secret
PAYPAL_ENVIRONMENT=sandbox
```

### Comptes Sandbox à créer :

1. **Plateforme Business Account**
   - Nom : "E-Learning Platform"
   - Email : `platform@paypalsandbox.com` (généré automatiquement)
   - Type : Business
   - Obtenez les credentials : Client ID + Secret

2. **Student Test Account**
   - Nom : "Test Student"
   - Email : `student@paypalsandbox.com` (généré automatiquement)
   - Type : Personal
   - Pas besoin de credentials
   - Utilisez cet email/mot de passe pour tester les paiements

## 🔐 Obtenir les Credentials PayPal

1. Allez sur https://developer.paypal.com/
2. Dashboard → Sandbox → Accounts
3. Créez un compte Business
4. Dashboard → My Apps & Credentials
5. Sous "Sandbox", créez une nouvelle App
6. Copiez le **Client ID** et **Secret**

## ✅ Workflow de Test

### Test simple (paiement étudiant → plateforme) :

```bash
1. Configurez PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET (compte plateforme)
2. Lancez votre backend et frontend
3. Sur le checkout, choisissez PayPal
4. Connectez-vous avec le compte étudiant sandbox
5. Complétez le paiement
6. Vérifiez que l'argent arrive au compte plateforme
```

## 🔄 Future : Implémentation PayPal Marketplace

Si vous voulez implémenter le split comme Stripe Connect :

**PayPal Marketplace** permet de :
- Recevoir les paiements sur le compte plateforme
- Splitter automatiquement avec les instructeurs
- Gérer les remboursements et disputes

**Comptes nécessaires** :
- 1 compte Plateforme (Marketplace)
- N comptes Instructeurs (Business, connectés au marketplace)

## 📚 Ressources

- [PayPal Sandbox Accounts](https://developer.paypal.com/docs/api-basics/sandbox/accounts/)
- [PayPal Marketplace](https://developer.paypal.com/docs/marketplaces/)
- [PayPal Split Payments](https://developer.paypal.com/docs/marketplaces/integrate/)

## ⚠️ Note Importante

L'implémentation actuelle **ne supporte pas encore** le split PayPal pour les instructeurs. 
- ✅ Les paiements de cours fonctionnent (100% vers la plateforme)
- ❌ Les sessions live avec split ne sont pas encore implémentées pour PayPal
- 💡 Pour les sessions live, utilisez Stripe Connect (déjà implémenté)

Pour ajouter le support PayPal Marketplace, il faudrait :
1. Implémenter PayPal Marketplace API
2. Créer un système similaire à Stripe Connect
3. Permettre aux instructeurs de connecter leurs comptes PayPal
