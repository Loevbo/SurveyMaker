using Microsoft.Extensions.Localization;
using SurveyMaker.Localization;
using Volo.Abp.DependencyInjection;
using Volo.Abp.Ui.Branding;

namespace SurveyMaker;

[Dependency(ReplaceServices = true)]
public class SurveyMakerBrandingProvider : DefaultBrandingProvider
{
    private IStringLocalizer<SurveyMakerResource> _localizer;

    public SurveyMakerBrandingProvider(IStringLocalizer<SurveyMakerResource> localizer)
    {
        _localizer = localizer;
    }

    public override string AppName => _localizer["AppName"];
}
