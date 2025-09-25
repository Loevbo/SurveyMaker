using SurveyMaker.EntityFrameworkCore;
using Volo.Abp.Autofac;
using Volo.Abp.Modularity;

namespace SurveyMaker.DbMigrator;

[DependsOn(
    typeof(AbpAutofacModule),
    typeof(SurveyMakerEntityFrameworkCoreModule),
    typeof(SurveyMakerApplicationContractsModule)
)]
public class SurveyMakerDbMigratorModule : AbpModule
{
}
