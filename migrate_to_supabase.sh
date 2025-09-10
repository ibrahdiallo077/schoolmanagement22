#!/bin/bash

# Variables de configuration locale
LOCAL_DB="ecole_moderne"
LOCAL_USER="postgres"
LOCAL_HOST="localhost"
LOCAL_PORT="5432"
LOCAL_PASSWORD="Docta123+"

# Variables Supabase
SUPABASE_HOST="aws-1-eu-west-3.pooler.supabase.com"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres.qhawjtjntayuxidfghxq"
SUPABASE_PORT="6543"
SUPABASE_PASSWORD="Diallo123!!Labe1222"


echo "🚀 Début de la migration vers Supabase..."

# 1. Export de la base locale
echo "📦 Export de la base de données locale..."
PGPASSWORD=$LOCAL_PASSWORD pg_dump \
  -h $LOCAL_HOST -p $LOCAL_PORT -U $LOCAL_USER -d $LOCAL_DB \
  --verbose --clean --if-exists \
  --no-owner --no-privileges \
  --format=custom --file=migration_supabase.dump

if [ $? -eq 0 ]; then
    echo "✅ Export réussi"
else
    echo "❌ Erreur lors de l'export"
    exit 1
fi

# 2. Import vers Supabase
echo "📤 Import vers Supabase..."
PGPASSWORD=$SUPABASE_PASSWORD pg_restore \
  -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
  --verbose --clean --if-exists \
  --no-owner --no-privileges \
  migration_supabase.dump

if [ $? -eq 0 ]; then
    echo "✅ Migration réussie vers Supabase!"
else
    echo "❌ Erreur lors de l'import"
    exit 1
fi

# 3. Nettoyage
rm migration_supabase.dump
echo "🧹 Fichiers temporaires supprimés"
echo "🎉 Migration terminée avec succès!"