using System.Threading.Tasks;
using Volo.Abp.DependencyInjection;

namespace SurveyMaker.Data;

/* This is used if database provider does't define
 * ISurveyMakerDbSchemaMigrator implementation.
 */
public class NullSurveyMakerDbSchemaMigrator : ISurveyMakerDbSchemaMigrator, ITransientDependency
{
    public Task MigrateAsync()
    {
        return Task.CompletedTask;
    }
}
