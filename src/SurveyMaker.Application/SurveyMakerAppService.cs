using SurveyMaker.Localization;
using Volo.Abp.Application.Services;

namespace SurveyMaker;

/* Inherit your application services from this class.
 */
public abstract class SurveyMakerAppService : ApplicationService
{
    protected SurveyMakerAppService()
    {
        LocalizationResource = typeof(SurveyMakerResource);
    }
}
