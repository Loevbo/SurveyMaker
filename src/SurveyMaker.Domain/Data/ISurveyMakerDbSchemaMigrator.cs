using System.Threading.Tasks;

namespace SurveyMaker.Data;

public interface ISurveyMakerDbSchemaMigrator
{
    Task MigrateAsync();
}
